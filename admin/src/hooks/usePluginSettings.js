import { useQuery, useQueryClient } from 'react-query';
import {
  useNotification,
  request
} from '@strapi/helper-plugin';

import { getTrad } from '../translations';

import pluginId from '../pluginId';

const usePluginSettings = () => {
  // const queryClient = useQueryClient();
  const toggleNotification = useNotification();

  const {
    isLoading,
    data,
    err,
    refetch: refetchSettings,
  } = useQuery('pluginSettings', async () => {

    try {
      return request(`/${pluginId}/settings`, { method: 'GET' });
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });

      return { err };
    }
  });

  const setSettingsMutation = async (...args) => {
    // console.log('setConfigMutation args', args)
    await request(`/${pluginId}/settings`, { method: 'PUT', body: args[0] }, true);
  }

  return {
    data,
    isLoading,
    err,
    setSettingsMutation,
    refetchSettings,
  };
};

export default usePluginSettings;
