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

const checkIfContainerExists = async (containerId) => {
  try {
    const container = await docker.getContainer(containerId);
    const data = await container.inspect();
    return { container, data };
  } catch (error) {
    return null;
  }
};

const startOrCreate = ({ buildCommand, startCommand, host }) => {
  try {
    const container = docker.getContainer(host.containerId);
    if (container.container_id) {
      container.start();
    }

    return constructDocker({
      githubUrl: host.githubUrl,
      buildCommand,
      startCommand,
      port: host.port,
    });
  } catch (error) {
    logger.error('Error starting container', error);
    return [error, null];
  }
};

const constructDocker = async ({
  githubUrl,
  buildCommand,
  startCommand,
  port,
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

    logger.info('Sucessfully built image', `${containerName}-image`);

    const container = await docker.createContainer({
      Image: `${containerName}-image`,
      name: containerName,
      ExposedPorts: {
        '3000/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [
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

    return [null, { url, containerId: container.id }];
  } catch (err) {
    console.log('error in building image', err);
  }
};

export default {
  pullImage,
  constructDocker,
  startOrCreate,
  checkIfContainerExists,
};
