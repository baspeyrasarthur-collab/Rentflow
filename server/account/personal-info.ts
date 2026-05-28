import { z } from "zod";

import { prisma } from "@/server/db/prisma";

const optionalText = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(maxLength).nullable());

const personalInfoSchema = z.object({
  firstName: optionalText(120),
  lastName: optionalText(120),
  phone: optionalText(32),
  addressLine1: optionalText(191),
  addressLine2: optionalText(191),
  postalCode: optionalText(32),
  city: optionalText(120),
  country: optionalText(120),
  taxResidenceCountry: optionalText(120),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export const PERSONAL_INFO_MISSING_LABELS: Record<
  keyof Pick<PersonalInfoInput, "taxResidenceCountry">,
  string
> = {
  taxResidenceCountry: "Residence fiscale",
};

export const PERSONAL_INFO_IMPORTANT_FIELDS = Object.keys(
  PERSONAL_INFO_MISSING_LABELS,
) as Array<keyof typeof PERSONAL_INFO_MISSING_LABELS>;

export function parsePersonalInfoFormData(formData: FormData) {
  return personalInfoSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    taxResidenceCountry: formData.get("taxResidenceCountry"),
  });
}

export function getMissingImportantPersonalInfo(
  user: Partial<
    Record<keyof typeof PERSONAL_INFO_MISSING_LABELS, string | null>
  >,
) {
  return PERSONAL_INFO_IMPORTANT_FIELDS.filter((field) => !user[field]).map(
    (field) => ({
      field,
      label: PERSONAL_INFO_MISSING_LABELS[field],
    }),
  );
}

export async function updateUserPersonalInfoForAccount(input: {
  formData: FormData;
  source: string;
  user: {
    id: string;
  };
}) {
  const data = parsePersonalInfoFormData(input.formData);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: input.user.id,
      },
      data,
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.user.id,
        action: "user.personal_info_updated",
        entityType: "User",
        entityId: input.user.id,
        metadata: {
          source: input.source,
        },
      },
    });
  });
}
