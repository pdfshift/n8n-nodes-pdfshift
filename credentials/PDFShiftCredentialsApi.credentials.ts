import {
    IAuthenticateGeneric,
    Icon,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class PDFShiftCredentialsApi implements ICredentialType {
    name = 'pdfshiftCredentialsApi';
    displayName = 'PDFShift API';

    icon: Icon = { light: 'file:../icons/pdfshift.png', dark: 'file:../icons/pdfshift-dark.png' };

    documentationUrl = 'https://docs.pdfshift.io/';

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
            headers: {
                'X-API-Key': '={{ $credentials.apiKey }}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://api.pdfshift.io',
            url: '/v3/credits/usage'
        },
    };
}
