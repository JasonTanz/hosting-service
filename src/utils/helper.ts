import * as os from 'os';
export const getHostIpAddress = () => {
  const interfaces = os.networkInterfaces();
  // Iterate over the network interfaces
  for (const interfaceName of Object.keys(interfaces)) {
    // Look for non-internal IPv4 addresses
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  // If no non-internal IPv4 address is found, return null
  return null;
};

export const constructRandomPorts = (ports: number[]) => {
  const minRange = 10000;
  const maxRange = 11000;

  // Generate an array of numbers from minRange to maxRange
  const possibleNumbers = Array.from(
    { length: maxRange - minRange + 1 },
    (_, i) => i + minRange,
  );

  // Remove numbers that are in the given array
  ports.forEach((num) => {
    const index = possibleNumbers.indexOf(num);
    if (index !== -1) {
      possibleNumbers.splice(index, 1);
    }
  });

  // Return a random number from the filtered array
  return possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
};

export const retrieveRepoName = (githubUrl: string) => {
  const parts = githubUrl.split('/');
  const repoName = parts[parts.length - 1].replace('.git', '');

  return repoName;
};

export const constructDockerFile = ({
  githubUrl,
  buildCommand,
  startCommand,
  repoName,
}: {
  githubUrl: string;
  buildCommand: string;
  startCommand: string;
  repoName: string;
}) => {
  return `
  FROM node:20-alpine

  WORKDIR /app

  RUN apk update && apk add git
  RUN git clone ${githubUrl} ${repoName}

  WORKDIR /app/${repoName}

  RUN ${buildCommand || 'npm install'}

  EXPOSE 3000

  CMD ${startCommand || 'npm start'} 
  `;
};

export const constructContainerName = (name, port) => {
  return `${name}_${port}`;
};

export const constructURL = (port) => {
  const ipAddress = getHostIpAddress();
  return `http://${ipAddress}:${port}`;
};
