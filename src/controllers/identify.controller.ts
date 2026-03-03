import { Request, Response } from "express";
import { identifyService } from "../services/identify.service";

export const identifyController = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "Either email or phoneNumber must be provided",
      });
    }

    const result = await identifyService(email, phoneNumber);

    return res.status(200).json({ contact: result });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};