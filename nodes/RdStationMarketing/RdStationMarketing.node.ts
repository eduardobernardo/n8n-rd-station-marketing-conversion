import { IExecuteFunctions } from 'n8n-core';

import { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

import { OptionsWithUri } from 'request';

export class RdStationMarketing implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'RD Station Marketing',
		name: 'rdStationMarketing',
		icon: 'file:rdstationmarketing.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create conversion in RD Station Marketing',
		defaults: {
			name: 'New conversion RD Station Marketing',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'rdStationMarketingApi',
				required: true,
			},
		],
		properties: [
			// Resources and operations will go here
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Conversion',
						value: 'conversion',
					},
				],
				default: 'conversion',
				noDataExpression: true,
				required: true,
				description: 'Create a new conversion',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['conversion'],
					},
				},
				options: [
					{
						name: 'New Conversion',
						value: 'new',
						description: 'Register a new conversion',
						action: 'Register a new conversion',
					},
				],
				default: 'new',
				noDataExpression: true,
			},
			{
				displayName: 'Identifier',
				name: 'identifier',
				type: 'string',
				required: true,
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						operation: ['new'],
						resource: ['conversion'],
					},
				},
				default: '',
				placeholder: 'new lead',
				description: 'Conversion Identifier',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						operation: ['new'],
						resource: ['conversion'],
					},
				},
				default: '',
				placeholder: 'name@email.com',
				description: 'Primary email for the lead',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: [
							'conversion',
						],
						operation: [
							'new',
						],
					},
				},
				options: [
					{
						displayName: 'Custom Fields',
						name: 'customFields',
						placeholder: 'Add Custom Fields',
						description: 'Adds a custom fields to set also values which have not been predefined',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'customFieldValues',
								displayName: 'Field',
								values: [
									{
										displayName: 'Field Name on RD Station Marketing',
										name: 'fieldId',
										type: 'string',
										default: '',
										description:
											'Custom field created in RDSM and its value related to the contact. All custom fields available in the RD Station Marketing account are valid in this payload. They must be sent with the prefix "cf_" plus the name of the field, for example: cf_idade You can find the identifier of fields already created or create new ones at <a href="https://app.rdstation.com.br/campos-personalizados">RD Station Marketing - Custom Fields</a>.',
									},
									{
										displayName: 'Field Value',
										name: 'fieldValue',
										type: 'string',
										default: '',
										description: 'Value of the field to set',
									},
								],
							},
						],
					},
				],
			},

		],
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData();
		let responseData;
		const returnData = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// For each item, make an API call to create a contact
		for (let i = 0; i < items.length; i++) {
			if (resource === 'conversion') {
				if (operation === 'new') {
					// Get identifier input
					const identifier = this.getNodeParameter('identifier', i) as string;
					// Get email input
					const email = this.getNodeParameter('email', i) as string;
					// Set the Payload
					const payload: IDataObject = {
						conversion_identifier: identifier,
						email: email,
					};
					// Get additional fields input
					const { customFields } = this.getNodeParameter('additionalFields', i) as {
						customFields: {
							customFieldValues: [
								{
									fieldId: string;
									fieldValue: string;
								},
							];
						};
					};
					if (customFields?.customFieldValues) {
						const { customFieldValues } = customFields;
						const data = customFieldValues.reduce(
							(obj, value) => Object.assign(obj, { [`${value.fieldId}`]: value.fieldValue }),
							{},
						);
						Object.assign(payload, data);
					}

					const data: IDataObject = {
						event_type: "CONVERSION",
						event_family: "CDP",
						payload
					};

					const options: OptionsWithUri = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'POST',
						body: {
							data
						},
						uri: `https://api.rd.services/platform/conversions`,
						json: true,
					};
					responseData = await this.helpers.requestWithAuthentication.call(this, 'RdStationMarketingApi', options);
					returnData.push(responseData);
				}
			}
		}
		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];

	}
}
