import { useIntl } from 'react-intl';
import { isString } from 'lodash';

import pluginId from '../pluginId';

const getTrad = (id, inPluginScope = true) => `${inPluginScope ? pluginId : 'app.components'}.${id}`;

const getTradObject = (id, defaultMessage = '', inPluginScope = true) => {
  return {
    id: getTrad(id, inPluginScope),
    defaultMessage: `TOTRAD: ${defaultMessage}`,
  }
}

const getMessage = (input, defaultMessage = '', inPluginScope = true) => {
    const { formatMessage } = useIntl();

    let formattedId = ''
    if (isString(input)) {
        formattedId = input;
    } else {
        formattedId = input?.id;
    }

    return formatMessage(
      getTradObject(formattedId, defaultMessage, inPluginScope),
      input?.props || undefined
    )
};

export {
  getTrad,
  getTradObject,
  getMessage,
}