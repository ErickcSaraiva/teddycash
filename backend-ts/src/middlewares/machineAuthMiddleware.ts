import { createHash, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';

export interface MachineRequest extends Request {
  authenticatedMachineId?: string;
}

function unauthorized(res: Response) {
  return res.status(401).json({
    error: { code: 'INVALID_MACHINE_CREDENTIALS', message: 'Credenciais da maquina invalidas.' },
  });
}

export async function verifyMachine(req: MachineRequest, res: Response, next: NextFunction) {
  const machineId = req.header('x-machine-id');
  const [scheme, apiKey] = (req.header('authorization') ?? '').split(' ');

  if (!machineId || scheme !== 'Bearer' || !apiKey) return unauthorized(res);

  try {
    const machine = await prisma.machine.findUnique({ where: { id: machineId } });
    if (!machine?.active) return unauthorized(res);

    const suppliedHash = createHash('sha256').update(apiKey).digest();
    const storedHash = Buffer.from(machine.apiKeyHash, 'hex');
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
      return unauthorized(res);
    }

    req.authenticatedMachineId = machine.id;
    return next();
  } catch (error) {
    return next(error);
  }
}
