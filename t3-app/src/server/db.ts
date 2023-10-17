import { connect } from '@planetscale/database';

import { PrismaPlanetScale } from '@prisma/adapter-planetscale';

import { PrismaClient } from '@prisma/client';

import { fetch as undiciFetch } from 'undici';

const connectionString = `${process.env.DATABASE_URL}`;


// init prisma client

const connection = connect({ url: connectionString, fetch: undiciFetch });

const adapter = new PrismaPlanetScale(connection);

export const db = new PrismaClient({ adapter });