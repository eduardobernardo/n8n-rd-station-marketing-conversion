import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RdStationMarketingApi implements ICredentialType {
	name = 'rdStationMarketingApi';
	displayName = 'RD Station Marketing API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
        // Use the value from `apiKey` above
				'api_key': '={{$credentials.apiKey}}'
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.rd.services',
			url: '/platform/conversions',
		},
	};
}
