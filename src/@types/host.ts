export type THost = {
  id: string;
  githubUrl: string;
  containerName: string;
  port: number;
  createdAt: Date;
  updatedAt: Date;
};

export type THostPayload = Omit<THost, 'id' | 'createdAt' | 'updatedAt'>;
