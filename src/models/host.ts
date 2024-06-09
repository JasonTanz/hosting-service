module.exports = (sequelize, DataTypes) => {
  const Host = sequelize.define('hosts', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },

    githubUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    containerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
  return Host;
};
