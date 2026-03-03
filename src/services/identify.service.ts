import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {
  return await prisma.$transaction(async (tx) => {

    //  direct matches
    const initialMatches = await tx.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // no matches = new primary
    if (initialMatches.length === 0) {
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

    //  all related IDs
    const relatedIds = new Set<number>();

    for (const contact of initialMatches) {
      relatedIds.add(contact.id);
      if (contact.linkedId) {
        relatedIds.add(contact.linkedId);
      }
    }

    // full linked cluster
    const allContacts = await tx.contact.findMany({
      where: {
        OR: [
          { id: { in: Array.from(relatedIds) } },
          { linkedId: { in: Array.from(relatedIds) } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // oldest becomes primary
    const primary = allContacts[0];

    // others to secondary
    for (const contact of allContacts) {
      if (contact.id !== primary.id) {
        await tx.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: primary.id,
          },
        });
      }
    }

    // continue next feature
    return {};
  });
};