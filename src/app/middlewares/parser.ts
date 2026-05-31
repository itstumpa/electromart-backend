import { NextFunction, Request, Response } from "express";

export const parseData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body?.data) {
    try {
      const parsed = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsed };
      delete req.body.data;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON format in data" });
    }
  }

  // coerce flat string booleans (from FormData individual fields)
  for (const key of Object.keys(req.body)) {
    if (req.body[key] === 'true')  req.body[key] = true;
    if (req.body[key] === 'false') req.body[key] = false;
  }

  next();
};