import { IDataObject, IHttpRequestOptions, IN8nHttpFullResponse } from 'n8n-workflow';

type PDFShiftRequestWithAuthentication = (requestOptions: IHttpRequestOptions,) => Promise<IN8nHttpFullResponse>;

export async function PDFShiftRequest({
    endpoint,
    parameters,
    requestWithAuthentication,
}: {
    endpoint: string;
    parameters: Record<string, unknown>;
    requestWithAuthentication: PDFShiftRequestWithAuthentication;
}): Promise<IDataObject | string | Buffer> {
    const method = endpoint === '/credits/usage' ? 'GET' : 'POST';

    const requestOptions: IHttpRequestOptions = {
        url: `https://api.pdfshift.io/v3${endpoint}`,
        method,
        returnFullResponse: true,
        encoding: 'arraybuffer',
    };

    if (method === 'POST') {
        requestOptions.body = parameters;
        requestOptions.json = true;
    }

    const response = await requestWithAuthentication(requestOptions);
    const contentType = getHeaderValue(response.headers, 'content-type');
    const body = response.body;

    if (isDataObject(body)) {
        return body;
    }

    if (contentType.includes('application/json')) {
        const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body ?? '{}');
        return JSON.parse(text);
    }

    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ''));
    if (parameters.encode) {
        return buffer.toString('base64');
    }

    return buffer;
}

function getHeaderValue(headers: IDataObject, targetHeader: string): string {
    const target = targetHeader.toLowerCase();
    for (const [headerName, value] of Object.entries(headers)) {
        if (headerName.toLowerCase() !== target || value === undefined || value === null) {
            continue;
        }

        if (Array.isArray(value)) {
            return String(value[0] ?? '');
        }

        return String(value);
    }

    return '';
}

function isDataObject(value: unknown): value is IDataObject {
    return typeof value === 'object' && value !== null && !Buffer.isBuffer(value);
}
