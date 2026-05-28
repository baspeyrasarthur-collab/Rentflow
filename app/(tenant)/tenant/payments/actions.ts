"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getPaymentProvider } from "@/server/payments";
import {
  buildMockPaymentSucceededData,
  shouldCreatePlatformCommission,
} from "@/server/payments/payment-data";
import {
  getTenantExternalPaymentForDeclaration,
  getTenantPaymentForMockPayment,
} from "@/server/tenant/payments";
import {
  paymentIdSchema,
  tenantExternalPaymentDeclarationSchema,
  type PaymentDeclarationTypeInput,
} from "@/server/validation";

const DEFAULT_RENT_COMMISSION_IN_CENTS = 490;
const DEFAULT_RENT_COMMISSION_KEY = "default_rent_commission";

function readPaymentId(formData: FormData) {
  const value = formData.get("paymentId");

  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "Payment id is required.");
  }

  return paymentIdSchema.parse(value);
}

function readExternalPaymentDeclarationInput(
  formData: FormData,
  expectedDeclarationType: PaymentDeclarationTypeInput,
) {
  const requiresPaidConfirmation =
    expectedDeclarationType === "PAID_EXTERNALLY";
  const fieldNames = Array.from(formData.keys());
  const unexpectedField = fieldNames.find(
    (fieldName) =>
      fieldName !== "paymentId" &&
      fieldName !== "declarationType" &&
      (!requiresPaidConfirmation || fieldName !== "confirmPaid") &&
      !fieldName.startsWith("$ACTION_"),
  );

  if (unexpectedField) {
    throw new AppError(
      "BAD_REQUEST",
      "Only payment id, declaration type and expected confirmation are accepted for this action.",
    );
  }

  const paymentId = formData.get("paymentId");
  const declarationType = formData.get("declarationType");

  if (typeof paymentId !== "string") {
    throw new AppError("BAD_REQUEST", "Payment id is required.");
  }

  if (typeof declarationType !== "string") {
    throw new AppError("BAD_REQUEST", "Declaration type is required.");
  }

  const parsed = tenantExternalPaymentDeclarationSchema.parse({
    paymentId,
    declarationType,
  });

  if (parsed.declarationType !== expectedDeclarationType) {
    throw new AppError(
      "BAD_REQUEST",
      "Declaration type does not match this action.",
    );
  }

  if (requiresPaidConfirmation && formData.get("confirmPaid") !== "on") {
    throw new AppError(
      "BAD_REQUEST",
      "Paid external payment declaration requires confirmation.",
    );
  }

  return parsed;
}

async function getRentCommissionAmountInCents() {
  const setting = await prisma.platformSetting.findUnique({
    where: {
      key: DEFAULT_RENT_COMMISSION_KEY,
    },
    select: {
      amountInCents: true,
      active: true,
    },
  });

  if (setting?.active) {
    return setting.amountInCents;
  }

  return DEFAULT_RENT_COMMISSION_IN_CENTS;
}

function buildOwnerPaymentDeclarationNotification(
  declarationType: PaymentDeclarationTypeInput,
  propertyName: string,
) {
  if (declarationType === "NOT_PAID_YET") {
    return {
      title: "Loyer pas encore paye",
      body: `Un locataire indique ne pas avoir encore paye un loyer pour ${propertyName}.`,
    };
  }

  return {
    title: "Loyer declare paye",
    body: `Un locataire indique avoir paye un loyer pour ${propertyName}. Confirmez uniquement apres reception reelle.`,
  };
}

async function declareTenantExternalPaymentAction(
  formData: FormData,
  declarationType: PaymentDeclarationTypeInput,
  source: string,
) {
  const { paymentId } = readExternalPaymentDeclarationInput(
    formData,
    declarationType,
  );
  const { user, tenantProfile, payment } =
    await getTenantExternalPaymentForDeclaration(paymentId);

  await prisma.$transaction(async (tx) => {
    const declaration = await tx.paymentDeclaration.create({
      data: {
        paymentId: payment.id,
        tenantProfileId: tenantProfile.id,
        contractTenantId: payment.contractTenantId,
        declarationType,
      },
      select: {
        id: true,
      },
    });

    const notification = buildOwnerPaymentDeclarationNotification(
      declarationType,
      payment.property.name,
    );

    await tx.notification.create({
      data: {
        userId: payment.ownerProfile.userId,
        type: "PAYMENT_PLANNED",
        title: notification.title,
        body: notification.body,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "payment_declaration.created",
        entityType: "PaymentDeclaration",
        entityId: declaration.id,
        metadata: {
          source,
          paymentId: payment.id,
          contractTenantId: payment.contractTenantId,
          declarationType,
        },
      },
    });
  });

  redirect("/tenant");
}

export async function declareTenantExternalPaymentPaidAction(
  formData: FormData,
) {
  return declareTenantExternalPaymentAction(
    formData,
    "PAID_EXTERNALLY",
    "tenant_declare_external_payment_paid",
  );
}

export async function declareTenantExternalPaymentNotPaidYetAction(
  formData: FormData,
) {
  return declareTenantExternalPaymentAction(
    formData,
    "NOT_PAID_YET",
    "tenant_declare_external_payment_not_paid_yet",
  );
}

export async function payTenantPaymentWithMockProviderAction(
  formData: FormData,
) {
  const paymentId = readPaymentId(formData);
  const { user, payment } = await getTenantPaymentForMockPayment(paymentId);
  const provider = getPaymentProvider();

  const providerPayment = await provider.createPayment({
    tenantId: payment.tenantProfileId,
    ownerId: payment.ownerProfileId,
    rentalContractId: payment.rentalContractId,
    contractTenantId: payment.contractTenantId ?? undefined,
    type: payment.type,
    amountInCents: payment.amountInCents,
    currency: payment.currency,
    dueDate: payment.dueDate,
  });

  if (providerPayment.provider !== "MOCK") {
    throw new AppError(
      "CONFLICT",
      "Only the mock payment provider is allowed.",
    );
  }

  const succeededPayment = await provider.markPaymentSucceeded(
    providerPayment.providerPaymentId,
  );

  if (succeededPayment.provider !== "MOCK") {
    throw new AppError(
      "CONFLICT",
      "Only the mock payment provider is allowed.",
    );
  }

  if (succeededPayment.status !== "SUCCEEDED") {
    throw new AppError("CONFLICT", "The mock payment did not succeed.");
  }

  const paidAt = new Date();
  const paymentUpdateData = buildMockPaymentSucceededData(
    succeededPayment.providerPaymentId,
    paidAt,
  );
  const shouldChargeCommission = shouldCreatePlatformCommission({
    provider: paymentUpdateData.provider,
    type: payment.type,
    status: paymentUpdateData.status,
  });
  const commissionAmountInCents = shouldChargeCommission
    ? await getRentCommissionAmountInCents()
    : null;

  await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: {
        id: payment.id,
        tenantProfileId: payment.tenantProfileId,
        contractTenantId: payment.contractTenantId,
        type: "RENT",
        OR: [
          {
            provider: null,
            providerPaymentId: null,
          },
          {
            provider: "MOCK",
          },
        ],
        status: {
          in: ["PLANNED", "PENDING"],
        },
      },
      data: paymentUpdateData,
    });

    if (result.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This payment can no longer be paid with the mock provider.",
      );
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "payment.mock_succeeded",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          source: "tenant_mock_payment",
          rentalContractId: payment.rentalContractId,
          contractTenantId: payment.contractTenantId,
        },
      },
    });

    if (shouldChargeCommission && commissionAmountInCents !== null) {
      await tx.platformCommission.create({
        data: {
          paymentId: payment.id,
          ownerProfileId: payment.ownerProfileId,
          amountInCents: commissionAmountInCents,
          currency: payment.currency,
          status: "CHARGED",
          chargedAt: paidAt,
        },
      });
    }
  });

  redirect("/tenant");
}
