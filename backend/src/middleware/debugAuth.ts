import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import logger from "../utils/logger";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

const debugAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.error("DEBUG AUTH: No authorization header");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    logger.info("DEBUG AUTH: Attempting to verify token");
    const decoded = verify(token, authConfig.secret);
    logger.info("DEBUG AUTH: Token decoded successfully", { decoded });
    
    const { id, profile, companyId } = decoded as TokenPayload;
    
    logger.info("DEBUG AUTH: Extracted user data", { 
      id, 
      profile, 
      companyId,
      companyIdType: typeof companyId,
      companyIdIsUndefined: companyId === undefined,
      companyIdIsNull: companyId === null
    });

    if (companyId === undefined || companyId === null) {
      logger.error("DEBUG AUTH: companyId is undefined or null", { 
        companyId, 
        decoded,
        tokenLength: token.length 
      });
      throw new AppError("Invalid token: companyId is missing", 403);
    }

    req.user = {
      id,
      profile,
      companyId
    };

    logger.info("DEBUG AUTH: User set in request", { 
      userId: req.user.id, 
      userCompanyId: req.user.companyId 
    });

  } catch (err: any) {
    logger.error("DEBUG AUTH: Error during token verification", { 
      error: err.message, 
      stack: err.stack 
    });
    
    if (err.message === "ERR_SESSION_EXPIRED" && err.statusCode === 401) {
      throw new AppError(err.message, 401);
    } else {
      throw new AppError(
        "Invalid token. We'll try to assign a new one on next request",
        403
      );
    }
  }

  return next();
};

export default debugAuth; 