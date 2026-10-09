import pino from 'pino';
import { env } from '../config/env.js';

const level = env.NODE_ENV === 'production' ? 'info' : env.NODE_ENV === 'test' ? 'silent' : 'debug';

export const logger = pino({ level });
