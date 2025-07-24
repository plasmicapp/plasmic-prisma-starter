import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import * as NextNavigation from "next/navigation";
import { Prisma } from '@prisma/client';
import { PrismaOperations } from "@/lib/prisma";
import { prismaQuery } from '@/functions/prismaQuery';

export const PLASMIC = initPlasmicLoader({
  nextNavigation: NextNavigation,
  projects: [
    {
      id: "xpjuD2VqBCGPggNh2kWhnV",  // ID of a project you are using
      token: "KoTB6pMixrtcshRIbTxm4O1eJlvcXdMpTysufELoDziDkJ7yLz6pGCYcUtADcmsNCpZAWVKr9w78UNw9Yp4Q"  // API token for that project
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
})

const prismaTableParam = {
    name: 'table',
    type: 'choice' as const,
    options: Object.values(Prisma.ModelName).map((name) => ({
        value: name,
        label: name,
    })),
    description: 'Select the Prisma model to query',
};

const getPrismaOperationParam = <T extends readonly string[]>(operations: T) => ({
    name: 'operation',
    type: 'choice' as const,
    options: [...operations].map((op) => ({
        value: op,
        label: op,
    })),
    description: 'Select the Prisma operation to perform',
    multiSelect: false as const,
});


PLASMIC.registerFunction(prismaQuery, {
    name: 'prismaQuery',
    isQuery: true,
    params: [
        prismaTableParam,
        getPrismaOperationParam(PrismaOperations),
        {
            name: 'args',
            type: 'object',
            description: 'The Prisma query arguments',
        }
    ],
});
