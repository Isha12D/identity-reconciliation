import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

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

        // check if new info needs new secondary
    const emailExists = allContacts.some((c: typeof allContacts[number]) => c.email === email);
    const phoneExists = allContacts.some((c: typeof allContacts[number]) => c.phoneNumber === phoneNumber);

    if (!emailExists || !phoneExists) {
      await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primary.id,
          linkPrecedence: "secondary",
        },
      });
    }

    // Fetch updated 
    const finalContacts = await tx.contact.findMany({
      where: {
        OR: [
          { id: primary.id },
          { linkedId: primary.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      primaryContatctId: primary.id,
      emails: [...new Set(finalContacts.map((c:any) => c.email).filter(Boolean))],
      phoneNumbers: [...new Set(finalContacts.map((c:any) => c.phoneNumber).filter(Boolean))],
      secondaryContactIds: finalContacts
        .filter((c:any) => c.linkPrecedence === "secondary")
        .map((c:any) => c.id),
    };

    // continue next feature
    
  });
};