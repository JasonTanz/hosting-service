import { logger } from '../config/logger';
import { constructRandomPorts, constructURL } from '../utils/helper';
import hostService from '../services/host.service';
import dockerService from '../services/docker.service';
import { containerSchema, hostSchema } from '../schema';
const createHost = async (req, res) => {
  const { value, error } = hostSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { githubUrl, buildCommand, startCommand } = value;
  try {
    const [err, ports] = await hostService.getExistingPorts();

    if (err) {
      return res.status(500).json({
        status: false,
        message: `Error getting existing ports`,
      });
    }

    const availablePorts = constructRandomPorts(ports);

    if (!availablePorts) {
      return res.status(400).json({
        status: false,
        message: 'No available ports',
      });
    }

    try {
      const [err, host] = await dockerService.constructDocker({
        githubUrl,
        buildCommand,
        startCommand,
        port: availablePorts,
      });

      if (err) {
        return res.status(500).json({
          status: false,
          message: `Error constructing docker - ${err}`,
        });
      }

      const newHost = await hostService.create({
        containerId: host.containerId,
        port: availablePorts,
        githubUrl,
      });

      if (newHost[0]) {
        logger.error('Error creating host', newHost[0]);
        return res.status(500).json({
          status: false,
          message: `Error creating host - ${newHost[0]}`,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'Container created successfully',
        host,
      });
    } catch (error) {
      logger.error('Error creating container', error);
      return res.status(500).json({
        status: false,
        message: `Error creating container - ${error}`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error creating container - ${error}`,
    });
  }
};

const getHostByContainerId = async (req, res) => {
  const { error, value } = containerSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { containerId } = value;
  try {
    const [err, host] = await hostService.getHostByContainerId(containerId);
    if (err) {
      return res.status(500).json({
        status: false,
        message: `Error getting host by container id - ${err}`,
      });
    }
    logger.info('Host found by container id', host);
    const url = constructURL(host.port);
    return res.status(200).json({
      status: true,
      host,
      url,
    });
  } catch (error) {
    logger.error('Error getting host by container id', error);
    return res.status(500).json({
      status: false,
      message: `Error getting host by container id - ${error}`,
    });
  }
};

export default { createHost, getHostByContainerId };
