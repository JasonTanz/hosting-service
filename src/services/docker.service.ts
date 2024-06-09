import Dockerode from 'dockerode';
import {
  constructContainerName,
  constructDockerFile,
  constructURL,
  retrieveRepoName,
} from '../utils/helper';
import { logger } from '../config/logger';
import * as fs from 'fs';
const docker = new Dockerode();

const pullImage = async (image): Promise<void> => {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });
  });
};

const getContainerByName = async (containerName) => {
  try {
    const containers = await docker.listContainers({
      all: true,
    });
    const findContainer = containers.find(
      (c) => c.Names[0] === `/${containerName}`,
    );
    const container = await docker.getContainer(findContainer.Id);
    const data = await container.inspect();
    return { container, data };
  } catch (error) {
    return null;
  }
};

const constructDocker = async ({
  githubUrl,
  buildCommand,
  startCommand,
  port,
  servicePort = 3000,
}) => {
  const repoName = retrieveRepoName(githubUrl);
  const dockerFile = constructDockerFile({
    githubUrl,
    buildCommand,
    startCommand,
    repoName,
  });
  const containerName = constructContainerName(repoName, port);

  try {
    fs.writeFileSync(`/tmp/Dockerfile`, dockerFile);
    logger.info('Dockerfile created successfully');
  } catch (error) {
    logger.error('Error creating Dockerfile', error);
    return [error, null];
  }

  try {
    await pullImage('node:20-alpine');

    const stream = await docker.buildImage(
      {
        context: '/tmp',
        src: [`Dockerfile`],
      },
      { t: `${containerName}-image` },
    );

    stream.pipe(process.stdout, { end: true });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });

    logger.info('Successfully built image', `${containerName}-image`);

    const container = await docker.createContainer({
      Image: `${containerName}-image`,
      name: `${containerName}`,
      ExposedPorts: {
        [`${servicePort}/tcp`]: {},
      },
      HostConfig: {
        PortBindings: {
          [`${servicePort}/tcp`]: [
            {
              HostPort: port.toString(),
            },
          ],
        },
      },
    });
    await container.start();
    logger.info('Container started successfully', container.id);

    const url = constructURL(port);

    return [null, { url, containerName }];
  } catch (err) {
    console.log('error in building image', err);
  }
};

export default {
  pullImage,
  constructDocker,
  getContainerByName,
};
