import { useQuery, useQueryClient } from 'react-query';
import {
  useNotification,
  request
} from '@strapi/helper-plugin';

import { getTrad } from '../translations';

import pluginId from '../pluginId';

const usePluginConfig = () => {
  const queryClient = useQueryClient();
  const toggleNotification = useNotification();

  const {
    isLoading,
    data,
    err,
    refetch: refetchConfig,
  } = useQuery('pluginConfig', async () => {

    try {
      return request(`/${pluginId}/config`, { method: 'GET' });
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });

      return { err };
    }
  });

  const setConfigMutation = async (...args) => {
    // console.log('setConfigMutation args', args)
    await request(`/${pluginId}/config`, { method: 'PUT', body: args[0] }, true);
  }

  return {
    data,
    isLoading,
    err,
    setConfigMutation,
    refetchConfig,
  };
};

export default usePluginConfig;
