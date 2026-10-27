import { NextFunction, Request, Response } from "express";
import ResponseMessage from "../core/responseMessage/message.class";
import { clientIp } from "../utils/http";

interface Tracker {
  count: number;
  timestamps: number[];
}

const concurrentRequests = new Map<string, Tracker>();
const REQUEST_TIMEOUT = 300000;

function incrementRequest(ip: string, maxConcurrent: number): boolean {
  const now = Date.now();
  const tracker = concurrentRequests.get(ip);
  if (!tracker) {
    concurrentRequests.set(ip, { count: 1, timestamps: [now] });
    return true;
  }
  tracker.timestamps = tracker.timestamps.filter((stamp) => stamp > now - REQUEST_TIMEOUT);
  tracker.count = tracker.timestamps.length;
  if (tracker.count >= maxConcurrent) return false;
  tracker.count += 1;
  tracker.timestamps.push(now);
  return true;
}

function decrementRequest(ip: string): void {
  const tracker = concurrentRequests.get(ip);
  if (!tracker || tracker.count === 0) return;
  tracker.count -= 1;
  tracker.timestamps.shift();
  if (tracker.count <= 0) concurrentRequests.delete(ip);
}

export function rateLimit(maxConcurrent = 20) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const path = req.path || "";
    if (path.startsWith("/uploads") || path.startsWith("/resources")) {
      next();
      return;
    }
    const ip = clientIp(req);
    if (!incrementRequest(ip, maxConcurrent)) {
      ResponseMessage.send(
        res,
        ResponseMessage.error(
          { message: `Too many concurrent requests. Maximum ${maxConcurrent} allowed.` },
          "Too many requests",
          429,
        ),
      );
      return;
    }
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      decrementRequest(ip);
    };
    res.on("finish", release);
    res.on("close", release);
    next();
  };
}
