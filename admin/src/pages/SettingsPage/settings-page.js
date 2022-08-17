import React, { useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Formik } from 'formik';

import { Main } from '@strapi/design-system/Main';
import { ContentLayout, HeaderLayout } from '@strapi/design-system/Layout';
import { Accordion, AccordionToggle, AccordionContent, AccordionGroup } from '@strapi/design-system/Accordion';
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Divider } from '@strapi/design-system/Divider';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { TextInput } from '@strapi/design-system/TextInput';
import { Link } from '@strapi/design-system/Link';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Check, Refresh, Play, Information, ExclamationMarkCircle } from '@strapi/icons';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';

import {
  CheckPermissions,
  LoadingIndicatorPage,
  Form,
  SettingsPageTitle,
  StrapiAppContext,
  useAppInfos,
  useStrapiApp,
  request,
} from '@strapi/helper-plugin';


// import permissions from '../../permissions';
import { getMessage }  from '../../utils';
import usePluginSettings from '../../hooks/usePluginSettings';

import pluginId from '../../pluginId';

const SettingsPage = () => {

  // console.log('useAppInfos', useAppInfos())
  // console.log('useStrapiApp', useStrapiApp())

  const formRef = useRef(null);

  const {
    data: pluginSettingsData,
    isLoading: isSettingsLoading,
    err: settingsErr,
    setSettingsMutation,
    refetchSettings,
  } = usePluginSettings();


  const {
    data: authUrlData,
    isLoading: authUrlIsLoading,
    err: authUrlError,
    refetch: refetchAuthUrl,
  } = useQuery([
    'googlaDriveAuthURL',
    formRef?.current?.values.clientId,
    formRef?.current?.values.clientSecret,
  ], (params) => {

    if ( ! params.queryKey[1] || ! params.queryKey[1].length
      || ! params.queryKey[2] || ! params.queryKey[2].length
    ) {
      return
    }

    return request(`/${pluginId}/authUrl`, {
      method: 'GET',
      params: {
        clientId: params.queryKey[1],
        clientSecret: params.queryKey[2],
      }
    }, true)
  });

  const {
    isLoading: resultingFolderIsLoading,
    data: resultingFolderData,
    err: resultingFolderError,
    refetch: refetchResultingFolder,
  } = useQuery([
    'googlaDriveFolderResult',
    formRef?.current?.values.driveFolder,
  ], (params) => {
    return request(`/${pluginId}/google-drive-resulting-folder`, {
      method: 'GET',
      params: {
        driveFolder: params.queryKey[1] ?? '',
      }
    }, true)
  });

  const onUpdateFolderPattern = async () => {
    await setSettingsMutation({
      driveFolderPattern: formRef?.current?.values.driveFolder
    });

    refetchConfig()
  }

  const clientId      = pluginSettingsData?.clientId;
  const clientSecret  = pluginSettingsData?.clientSecret;
  const token         = pluginSettingsData?.token;
  const driveFolder   = pluginSettingsData?.driveFolderPattern; // TODO rename
  const dumpSettings  = pluginSettingsData?.dumpSettings;

  const clientIdFromConfig            = pluginSettingsData?.clientId_fromConfig;
  const clientSecretFromConfig        = pluginSettingsData?.clientSecret_fromConfig;
  const tokensFromConfig              = pluginSettingsData?.tokens_fromConfig;
  const driveFolderPatternFromConfig  = pluginSettingsData?.driveFolderPattern_fromConfig;

  const boxDefaultProps = {
		background: "neutral0",
		hasRadius: true,
		shadow: "filterShadow",
		padding: 6,
	};

  if (isSettingsLoading || settingsErr) {
    return (
      <>
        <SettingsPageTitle
          name={getMessage('Settings.email.plugin.title', 'Configuration')}
        />
        <LoadingIndicatorPage>
          {/* TODO: use translation */}
          Fetching plugin settings...
        </LoadingIndicatorPage>
      </>
    )
  }

  return (
    <>

      <SettingsPageTitle
        name={getMessage('Settings.email.plugin.title', 'Configuration')}
      />
      <Main labelledBy="title">

        <Formik
          innerRef={formRef}
          initialValues={{
            clientId,
            clientSecret,
            token,
            driveFolder,
          }}
        >
          {({ handleSubmit, setFieldValue, values }) => (
            <Form noValidate onSubmit={handleSubmit}>

              <HeaderLayout
                title={getMessage('pages.settings.header.title', 'Google Drive Configuration')}
                subtitle={getMessage('pages.settings.header.description', 'Configure the credentials of the Google Drive provider for your uploads')}
              />

              <ContentLayout>
                <Stack spacing={7}>

                  <Box {...boxDefaultProps} >
                    <Stack spacing={4}>
                      <Typography variant="delta" as="h2">
                        {getMessage('pages.settings.credentials.title', 'Google OAuth2 Credentials')}
                      </Typography>


                      <Grid gap={4}>
                        <GridItem col={12} s={12} xs={12}>

                          <ul>
                            <li>
                              <Typography>
                                +&nbsp;
                                <Link href="https://developers.google.com/workspace/guides/get-started" isExternal>
                                  {getMessage('pages.settings.projectCreation', 'You need to create a google cloud project first')}
                                </Link>
                              </Typography>
                            </li>
                            <li>
                              <Typography>
                                +&nbsp;
                                <Link href="https://developers.google.com/workspace/guides/enable-apis" isExternal>
                                  {getMessage('pages.settings.enableApi', 'Enable the "Google Drive API"')}
                                </Link>
                              </Typography>
                            </li>
                            <li>
                              <Typography>
                                +&nbsp;
                                <Link href="https://developers.google.com/workspace/guides/create-credentials#oauth-client-id" isExternal>
                                  {getMessage('pages.settings.createOAuthCilentIds', 'Create OAuth 2.0 Client IDs using the redirect URI below')}
                                </Link>
                              </Typography>
                            </li>
                          </ul>

                          <br/>

                          <TextInput
                            name="redirect_uris"
                            label={getMessage('pages.settings.form.setFolder.label', `Redirect URI to add to your project's OAuth credentials`)}
                            value={`${strapi.backendURL}/${pluginId}/google-auth-redirect-uri`}
                            hint={`You will have to add one redirect URI per environment/domain (dev, prod, ...)`}

                            disabled={true}
                          />
                        </GridItem>

                        <GridItem col={12} s={12} xs={12}>
                          <TextInput
                            name="clientId"
                            label={getMessage('pages.settings.form.clientId.label', 'Client ID')}
                            placeholder={getMessage('pages.settings.form.clientId.placeholder', ' ')}
                            hint={`You can also add it to your "config/plugin.js" as "upload-google-drive.oauth.clientId" entry`}
                            onChange={(event) => {
                              setFieldValue('clientId', event.target.value, false)
                              refetchAuthUrl()
                            }}
                            value={values.clientId}
                            disabled={clientIdFromConfig}
                          />
                        </GridItem>

                        <GridItem col={12} s={12} xs={12}>
                          <TextInput
                            name="clientSecret"
                            label={getMessage('pages.settings.form.clientSecret.label', 'Client Secret')}
                            placeholder={getMessage('pages.settings.form.clientSecret.placeholder', ' ')}
                            onChange={(event) => {
                              setFieldValue('clientSecret', event.target.value, false)
                              refetchAuthUrl()
                            }}
                            value={values.clientSecret}
                            hint={`You can also add it to your "config/plugin.js" as "upload-google-drive.oauth.clientSecret" entry`}
                            disabled={clientSecretFromConfig}
                          />
                        </GridItem>

                        <GridItem col={12} s={12} xs={12}>

                          { pluginSettingsData.tokens &&
                          <Typography>
                            {getMessage('pages.settings.token.updatedOn', 'The current token has been generated on')}&nbsp;
                            {new Date(pluginSettingsData.tokens.expiry_date).toUTCString()}.&nbsp;

                          </Typography>
                          }

                          <Link href="https://developers.google.com/identity/protocols/oauth2#expiration" isExternal>
                            Google's token expiration rules
                          </Link>

                          <br/>
                          <br/>

                          <Button
                            startIcon={<Refresh />}
                            onClick={() => {if (authUrlData?.authUrl != null) window.location = authUrlData.authUrl} }
                            disabled={tokensFromConfig || authUrlIsLoading || (! values.clientId) || (! values.clientSecret) }
                          >
                            {getMessage('pages.token.generate', 'Generate New Token')}
                          </Button>
                        </GridItem>

                      </Grid>
                    </Stack>
                  </Box>


                  <Box {...boxDefaultProps} >
                    <Stack spacing={4}>
                      <Typography variant="delta" as="h2">
                        {getMessage('pages.settings.setFolder.title', 'Google Drive Target Folder')}
                      </Typography>
                      <Grid gap={4}>
                        <GridItem col={12} s={12} xs={12}>
                          <Typography>
                            {getMessage('pages.settings.setFolder.description', 'Define the Google Drive folder in which you want to store your uploads')}
                          </Typography>
                        </GridItem>
                        <GridItem col={12} s={12} xs={12}>

                          <TextInput
                            name="driveFolder"
                            label={getMessage('pages.settings.form.setFolder.label', 'Target Folder Pattern')}
                            placeholder={ resultingFolderData?.defaultPattern }
                            hint={
                              <span>
                                - {getMessage(
                                  'pages.settings.form.setFolder.hint.variables',
                                  'The variables listed below can be inserted using the following syntax: '
                                )}
                                {'{{ package.name | env | ... }}'}.
                                <br/>
                                - {getMessage(
                                  'pages.settings.form.setFolder.hint.root',
                                  'Type "/" to store your uploads at the root of your drive'
                                )}
                              </span>
                            }
                            onChange={(event) => {
                              setFieldValue('driveFolder', event.target.value, false)
                              // onUpdateDriveFolderTemplate()
                              refetchResultingFolder()
                            }}
                            value={values.driveFolder}
                            disabled={driveFolderPatternFromConfig}
                          />

                          <br/>
                          <br/>

                          <TextInput
                            name="driveFolderResult"
                            label={getMessage('pages.settings.form.setFolder.label', 'Target Folder Result')}
                            placeholder={getMessage('pages.settings.form.setFolder.placeholder', 'Please set a folder pattern')}
                            hint={
                              <span>
                                - {getMessage(
                                  'pages.settings.form.driveFolderResult.hint.creation',
                                  'The folder will be created on your drive during the next upload. '
                                )}
                                <br/>
                                - {getMessage(
                                  'pages.settings.form.driveFolderResult.hint.noBreak',
                                  'Changing the folder will not break your existing uploads. You can move them manually, if you want, in Drive with no fear.'
                                )}
                              </span>
                            }
                            value={! resultingFolderIsLoading ? resultingFolderData?.result : 'loading...'}
                            disabled={true}
                          />

                        </GridItem>
                        <GridItem col={12} s={12} xs={12}>

                          <Button
                            startIcon={<Check />}
                            onClick={() => onUpdateFolderPattern()}
                            disabled={driveFolderPatternFromConfig}
                          >
                            {getMessage('pages.settings.form.setFolder.label', 'Update folder')}
                          </Button>

                        </GridItem>
                        <GridItem col={12} s={12} xs={12}>

                          <div
                            style={ {
                              minHeight: '10rem',
                            } }
                          >
                            <Table
                              colCount={2}
                              rowCount={ resultingFolderData?.availableVariables ? Object.keys(resultingFolderData.availableVariables).length : 0 }
                              style={ {
                                padding: '0',
                              } }
                            >
                              <Thead>
                                <Tr style={ {padding: '5px'} }>
                                  <Th colSpan={2} style={ {textAlign: 'center'} }>
                                    <Typography variant="sigma">Available Variables</Typography>
                                  </Th>
                                </Tr>
                              </Thead>
                              <Tbody
                                style={ {
                                  height: '10rem',
                                  overflow: 'auto',
                                  display: 'block',
                                } }
                              >
                              { ! resultingFolderData?.availableVariables &&
                                <Tr key={0}>
                                  <Td style={ {padding: '5px'} }>
                                    Loading...
                                  </Td>
                                </Tr>
                              }
                              { resultingFolderData?.availableVariables && Object.keys(resultingFolderData.availableVariables).map((key) => (
                                <Tr key={key}>
                                  <Td style={ {padding: '5px'} }>
                                    { key }
                                  </Td>
                                  <Td style={ {padding: '5px'} }>
                                    { resultingFolderData.availableVariables[key] }
                                  </Td>
                                </Tr>
                              ))}
                              </Tbody>
                            </Table>
                          </div>

                        </GridItem>
                      </Grid>
                    </Stack>
                  </Box>

                  { dumpSettings &&
                  <Box {...boxDefaultProps} >
                    <Stack spacing={4}>

                      <Typography variant="delta" as="h2">
                        {getMessage('pages.settings.credentials.title', 'Fetched Settings')}
                      </Typography>

                      <Grid gap={4}>
                        <GridItem col={12} s={12} xs={12}>
                          <pre style={ {maxWidth: '100%', overflow: 'auto', fontSize: '9pt'} }>
                            { JSON.stringify(pluginSettingsData, null, 2) }
                          </pre>
                        </GridItem>
                      </Grid>
                    </Stack>
                  </Box>
                  }

                </Stack>
              </ContentLayout>
            </Form>
          )}
        </Formik>

      </Main>
    </>
  );
}

export default SettingsPage;

