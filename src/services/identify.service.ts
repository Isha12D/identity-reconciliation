import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {
  return await prisma.$transaction(async (tx) => {

    // STEP 1: Find direct matches
    const matches = await tx.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // STEP 2: If no matches → create primary
    if (matches.length === 0) {
      const newContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        },
      });

      return {
        primaryContatctId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      };
    }

    // Continue logic in next feature
    return {};
  });
};