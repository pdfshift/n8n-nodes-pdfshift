import {
    IDataObject,
    IExecuteFunctions,
    IHttpRequestOptions,
    IN8nHttpFullResponse,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeApiError,
    NodeOperationError,
    NodeConnectionTypes
} from 'n8n-workflow';
import { PDFShiftRequest } from '../PDFShiftApi';

export class Pdfshift implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'PDFShift',
        name: 'pdfshift',
        subtitle: 'Convert HTML documents to PDF/Image',
        group: ['transform'],
        icon: {
            light: 'file:../../icons/pdfshift.png',
            dark: 'file:../../icons/pdfshift-dark.png'
        },
        version: 1,
        description: 'Generate PDF or images from URL or raw HTML documents using PDFShift',
        defaults: {
            name: 'PDFShift',
        },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        usableAsTool: true,
        credentials: [
            {
                name: 'pdfshiftCredentialsApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    { name: 'Convert To PDF', value: 'pdf' },
                    { name: 'Generate A Screenshot', value: 'screenshot' },
                    { name: 'View Your Credits Usage', value: 'usage' }
                ],
                noDataExpression: true,
                required: true,
                default: 'pdf',
            },
            {
                displayName: 'Source',
                name: 'source',
                type: 'options',
                options: [
                    { name: 'URL', value: 'url' },
                    { name: 'HTML', value: 'html' },
                ],
                default: 'url',
                description: 'The type of input to render',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'URL',
                name: 'url',
                type: 'string',
                description: 'The URL to render',
                required: true,
                default: '',
                requiresDataPath: 'single',
                displayOptions: {
                    show: {
                        source: ['url']
                    }
                }
            },
            {
                displayName: 'HTML',
                name: 'html',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                description: 'The HTML to render',
                required: true,
                default: '',
                requiresDataPath: 'single',
                displayOptions: {
                    show: {
                        source: ['html']
                    }
                }
            },
            {
                displayName: 'Format',
                name: 'type',
                type: 'options',
                options: [
                    { name: 'PNG', value: 'png' },
                    { name: 'JPEG', value: 'jpeg' },
                    { name: 'WEBP', value: 'webp' }
                ],
                default: 'jpeg',
                displayOptions: {
                    show: {
                        operation: ['screenshot']
                    }
                }
            },
            {
                displayName: 'Method',
                name: 'method',
                type: 'options',
                options: [
                    { name: 'Full Page', value: 'fullpage' },
                    { name: 'CSS Selector', value: 'selector' },
                    { name: 'Clip', value: 'clip' }
                ],
                default: 'fullpage',
                displayOptions: {
                    show: {
                        operation: ['screenshot']
                    }
                }
            },
            {
                displayName: 'Selector',
                name: 'selector',
                description: "Specific CSS Selector to target for the image",
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['screenshot'],
                        method: ['selector']
                    }
                }
            },
            {
                displayName: 'Clip',
                name: 'clip',
                description: 'Areas to select for the image',
                type: 'collection',
                options: [
                    {
                        displayName: 'Top',
                        name: 'y',
                        description: 'Position from the top',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    },
                    {
                        displayName: 'Left',
                        name: 'x',
                        description: 'Position from the left',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    },
                    {
                        displayName: 'Width',
                        name: 'width',
                        description: 'Width of the area',
                        type: 'number',
                        typeOptions: {
                            minValue: 1
                        },
                        default: null
                    },
                    {
                        displayName: 'Height',
                        name: 'height',
                        description: 'Height of the area',
                        type: 'number',
                        typeOptions: {
                            minValue: 1
                        },
                        default: null
                    }
                ],
                default: {},
                displayOptions: {
                    show: {
                        operation: ['screenshot'],
                        method: ['clip']
                    }
                }
            },
            {
                displayName: 'Transparent Background',
                name: 'transparent',
                description: 'Whether to set the background as transparent whenever possible',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['screenshot'],
                        type: ['png']
                    }
                }
            },
            {
                displayName: 'Quality',
                name: 'quality',
                description: 'Quality of the image',
                type: 'number',
                typeOptions: {
                    minValue: 10,
                    maxValue: 100
                },
                default: 80,
                required: true,
                displayOptions: {
                    show: {
                        operation: ['screenshot'],
                        type: ['jpeg']
                    }
                }
            },
            {
                displayName: 'DPI',
                name: 'dpi',
                description: 'DPI for the given image',
                type: 'options',
                options: [
                    { name: '1x', value: 1 },
                    { name: '2x', value: 2 },
                    { name: '4x', value: 4 }
                ],
                default: 1,
                displayOptions: {
                    show: {
                        operation: ['screenshot']
                    }
                }
            },
            {
                displayName: 'Format',
                name: 'format',
                description: 'Format in which to print the document. Accepts format such as A2, A3, A4, A5, A6, Letter, but also custom format using {width}x{height}, and {height} can be "auto" to adjust the height automatically.',
                type: 'string',
                default: 'A4',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Custom CSS',
                name: 'css',
                description: 'Inject custom CSS in the document',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: '',
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Custom Javascript',
                name: 'javascript',
                description: 'Inject custom javascript in the document',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: '',
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Header Section',
                name: 'header',
                description: 'Adds a custom header section to the PDF',
                type: 'collection',
                placeholder: 'Add header',
                default: {},
                options: [
                    {
                        displayName: 'Source',
                        name: 'source',
                        description: 'Source can be either raw HTML or an URL',
                        type: 'string',
                        default: ''
                    },
                    {
                        displayName: 'Height',
                        name: 'height',
                        description: 'A spacing between the header or footer and the content',
                        type: 'number',
                        default: null
                    },
                    {
                        displayName: 'Start At Page',
                        name: 'start_at',
                        type: 'number',
                        default: null,
                        typeOptions: {
                            minValue: 1
                        }
                    }
                ],
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Footer Section',
                name: 'footer',
                description: 'Adds a custom footer section to the PDF',
                type: 'collection',
                placeholder: 'Add footer',
                options: [
                    {
                        displayName: 'Source',
                        name: 'source',
                        description: 'Source can be either raw HTML or an URL',
                        type: 'string',
                        default: ''
                    },
                    {
                        displayName: 'Height',
                        name: 'height',
                        description: 'A spacing between the header or footer and the content',
                        type: 'number',
                        default: null
                    },
                    {
                        displayName: 'Start At Page',
                        name: 'start_at',
                        type: 'number',
                        default: null,
                        typeOptions: {
                            minValue: 1
                        }
                    }
                ],
                default: null,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Disable Javascript',
                name: 'disable_javascript',
                description: 'Whether to prevent JavaScript from running on the page',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Disable Images',
                name: 'disable_images',
                description: 'Whether to remove all images from the source before converting',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Lazy Load Images',
                name: 'lazy_load_images',
                description: 'Whether to scroll the whole page to ensure all lazy images are loaded before converting',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Disable Links',
                name: 'disable_links',
                description: 'Whether to remove all links from the source before converting',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Disable Backgrounds',
                name: 'disable_backgrounds',
                description: 'Whether to remove all background colors and images before converting',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Landscape Mode',
                name: 'landscape',
                description: 'Whether to generate a PDF in landscape format. Default is portrait.',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'Use Print CSS',
                name: 'use_print',
                description: 'Whether to use the print CSS stylesheet instead of the web one',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Wait for',
                name: 'wait_for',
                description: "Wait for a given function's name to return a truthy value before continuing",
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Sensitive Document',
                name: 'is_sensitive',
                description: 'Whether to enforce GDPR and BAA compliance before converting the document',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Margin',
                name: 'margin',
                description: 'Adds margin to the generated PDF',
                type: 'collection',
                options: [
                    {
                        displayName: 'Top',
                        name: 'top',
                        description: 'Top spacing in pixel',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    },
                    {
                        displayName: 'Bottom',
                        name: 'bottom',
                        description: 'Bottom spacing in pixel',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    },
                    {
                        displayName: 'Left',
                        name: 'left',
                        description: 'Left spacing in pixel',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    },
                    {
                        displayName: 'Right',
                        name: 'right',
                        description: 'Right spacing in pixel',
                        type: 'number',
                        typeOptions: {
                            minValue: 0
                        },
                        default: null
                    }
                ],
                default: null,
                displayOptions: {
                    show: {
                        operation: ['pdf']
                    }
                }
            },
            {
                displayName: 'HTTP Headers',
                name: 'http_headers',
                description: 'Add custom HTTP headers that will be sent to the URL being loaded',
                placeholder: 'Add Header',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true
                },
                default: null,
                options: [
                    {
                        name: 'headerValues',
                        displayName: 'Header',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                description: 'Name of the header key to add',
                                default: ''
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                description: 'Value to set for the header'
                            }
                        ]
                    }
                ],
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Cookies',
                name: 'cookies',
                description: 'Add custom cookies that will be sent along with the request',
                placeholder: 'Add Cookie',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true
                },
                default: null,
                options: [
                    {
                        name: 'cookieValues',
                        displayName: 'Cookie',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                description: 'Name of the cookie to add',
                                default: ''
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                description: 'Value to set for the cookie',
                                default: ''
                            },
                            {
                                displayName: 'Is Secure',
                                name: 'secure',
                                type: 'boolean',
                                default: false,
                                description: 'Whether the cookie works only on secure network (HTTPS)'
                            },
                            {
                                displayName: 'HTTP Only',
                                name: 'http_only',
                                type: 'boolean',
                                default: false,
                                description: 'Whether the cookie is only available on HTTP requests, not JavaScript'
                            }
                        ]
                    }
                ],
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Response Type',
                name: 'response_type',
                description: 'Either get the raw binary data, or a stored file on S3, available via an URL',
                type: 'options',
                options: [
                    {
                        name: 'Binary',
                        value: 'binary',
                        description: 'The raw, binary content of the generated document',
                    },
                    { name: 'JSON', value: 'json' }
                ],
                default: 'binary',
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Encode In Base64',
                name: 'encode',
                description: 'Whether to return the content as base64-encoded data instead of raw binary',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot'],
                        response_type: ['binary']
                    }
                }
            },
            {
                displayName: 'S3 Destination',
                name: 's3_destination',
                description: 'Use your own S3 Storage to store the generated document',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            },
            {
                displayName: 'Sandbox Mode',
                name: 'sandbox',
                description: "Whether to skip credit usage counting and add a watermark instead. Perfect for testing.",
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        operation: ['pdf', 'screenshot']
                    }
                }
            }
        ]
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const results: INodeExecutionData[] = [];
        const requestWithAuthentication = async (
            requestOptions: IHttpRequestOptions,
        ): Promise<IN8nHttpFullResponse> =>
            (await this.helpers.httpRequestWithAuthentication.call(
                this,
                'pdfshiftCredentialsApi',
                requestOptions,
            )) as IN8nHttpFullResponse;

        for (let i = 0; i < items.length; i++) {
            try {
                let endpoint = '' as string;
                const operation = this.getNodeParameter('operation', i) as string;

                const parameters: {
                    // Common
                    source?: string;
                    sandbox?: boolean;

                    css?: string;
                    javascript?: string;

                    wait_for?: string;
                    is_gdpr?: boolean;

                    lazy_load_images?: boolean;
                    use_print?: boolean;
                    disable_javascript?: boolean;

                    filename?: string;
                    encode?: boolean;
                    s3_destination?: string;
                    http_headers?: Record<string, string>;
                    cookies?: Array<{
                        name: string;
                        value: string;
                        secure: boolean;
                        http_only: boolean;
                    }>;

                    // PDF
                    disable_backgrounds?: boolean;
                    disable_links?: boolean;
                    disable_images?: boolean;
                    landscape?: boolean;
                    format?: string;
                    margin?: {
                        top?: number;
                        right?: number;
                        bottom?: number;
                        left?: number;
                    };
                    header?: {
                        source: string;
                        height?: number;
                        start_at?: number;
                    };
                    footer?: {
                        source: string;
                        height?: number;
                        start_at?: number;
                    };

                    // Images:
                    transparent?: boolean;
                    dpi?: number;
                    fullpage?: boolean;
                    css_selector?: string;
                    clip?: {
                        width: number;
                        height: number;
                        x: number;
                        y: number;
                    };
                    quality?: number;
                } = {};

                let binaryResponse = false as boolean;
                let extension = '.pdf' as string;
                let mimetype = 'application/pdf' as string;

                if (operation === 'usage') {
                    endpoint = '/credits/usage'
                } else {
                    if (operation === 'pdf') {
                        endpoint = '/convert/pdf'

                        // Custom parameters for PDF only
                        parameters['disable_backgrounds'] = this.getNodeParameter('disable_backgrounds', i, false) as boolean;
                        parameters['disable_links'] = this.getNodeParameter('disable_links', i, false) as boolean;
                        parameters['disable_images'] = this.getNodeParameter('disable_images', i, false) as boolean;
                        parameters['landscape'] = this.getNodeParameter('landscape', i, false) as boolean;
                        parameters['format'] = this.getNodeParameter('format', i, 'A4') as string;

                        const marginParameter = this.getNodeParameter('margin', i, {}) as {
                            top?: number;
                            right?: number;
                            bottom?: number;
                            left?: number;
                        };
                        if (Object.values(marginParameter).some((value) => value !== null && value !== undefined)) {
                            parameters['margin'] = marginParameter;
                        }


                        const headerParameter = this.getNodeParameter('header', i, null) as {
                            source: string;
                            height?: number;
                            start_at?: number;
                        }
                        if (headerParameter && headerParameter.source) {
                            parameters['header'] = {
                                source: headerParameter['source']
                            }

                            if (headerParameter.height) {
                                parameters['header']['height'] = headerParameter.height
                            }
                            if (headerParameter.start_at) {
                                parameters['header']['start_at'] = headerParameter.start_at
                            }
                        }

                        const footerParameter = this.getNodeParameter('footer', i, null) as {
                            source: string;
                            height?: number;
                            start_at?: number;
                        }
                        if (footerParameter && footerParameter.source) {
                            parameters['footer'] = {
                                source: footerParameter.source
                            }

                            if (footerParameter.height) {
                                parameters['footer']['height'] = footerParameter.height
                            }
                            if (footerParameter.start_at) {
                                parameters['footer']['start_at'] = footerParameter.start_at
                            }
                        }

                        const httpHeadersParameter = this.getNodeParameter('http_headers', i, null) as {
                            headerValues?: Array<{
                                name: string;
                                value: string;
                            }>;
                        } | null;
                        if (httpHeadersParameter?.headerValues?.length) {
                            const httpHeaders: Record<string, string> = {};
                            for (const header of httpHeadersParameter.headerValues) {
                                if (header.name) {
                                    httpHeaders[header.name] = header.value;
                                }
                            }

                            if (Object.keys(httpHeaders).length > 0) {
                                parameters['http_headers'] = httpHeaders;
                            }
                        }

                        const cookiesParameter = this.getNodeParameter('cookies', i, null) as {
                            cookieValues?: Array<{
                                name: string;
                                value: string;
                                secure: boolean;
                                http_only: boolean;
                            }>;
                        } | null;
                        if (cookiesParameter?.cookieValues?.length) {
                            const cookies = cookiesParameter.cookieValues.filter((cookie) => cookie.name);
                            if (cookies.length > 0) {
                                parameters['cookies'] = cookies;
                            }
                        }
                    } else if (operation === 'screenshot') {
                        const conversionType = this.getNodeParameter('type', i) as string;
                        endpoint = '/convert/' + conversionType
                        if (conversionType === 'jpeg') {
                            extension = '.jpg'
                            mimetype = 'image/jpeg'
                            parameters['quality'] = this.getNodeParameter('quality', i, 80) as number;
                        } else if (conversionType === 'png') {
                            extension = '.png'
                            mimetype = 'image/png'
                            parameters['transparent'] = this.getNodeParameter('transparent', i, false) as boolean;
                        } else {
                            extension = '.webp'
                            mimetype = 'image/webp'
                        }
                        parameters['dpi'] = this.getNodeParameter('dpi', i, 1) as number;

                        const screenshotMethod = this.getNodeParameter('method', i) as string;
                        if (screenshotMethod === 'fullpage') {
                            parameters['fullpage'] = true
                        } else if (screenshotMethod === 'selector') {
                            parameters['css_selector'] = this.getNodeParameter('selector', i) as string;
                        } else if (screenshotMethod === 'clip') {
                            parameters['clip'] = this.getNodeParameter('clip', i) as {
                                width: number;
                                height: number;
                                x: number;
                                y: number;
                            };
                        }
                    } else {
                        throw new NodeOperationError(this.getNode(), 'Unexpected operation', {
                            itemIndex: i,
                        });
                    }

                    if (this.getNodeParameter('source', i) === 'url') {
                        parameters['source'] = this.getNodeParameter('url', i) as string;
                    } else {
                        parameters['source'] = this.getNodeParameter('html', i) as string;
                    }

                    if (this.getNodeParameter('is_sensitive', i, false)) {
                        parameters['is_gdpr'] = true
                    }

                    const waitForParameter = this.getNodeParameter('wait_for', i) as string;
                    if (waitForParameter) {
                        parameters['wait_for'] = waitForParameter
                    }

                    const s3DestinationParameter = this.getNodeParameter('s3_destination', i, null) as string | null;
                    if (s3DestinationParameter) {
                        parameters['s3_destination'] = s3DestinationParameter
                    }

                    if (this.getNodeParameter('response_type', i) === 'binary') {
                        if (!parameters['s3_destination']) {
                            binaryResponse = true
                        }

                        parameters['encode'] = this.getNodeParameter('encode', i, false) as boolean;
                    } else {
                        parameters['filename'] = 'generated' + extension
                    }

                    parameters['sandbox'] = this.getNodeParameter('sandbox', i, false) as boolean;
                    parameters['lazy_load_images'] = this.getNodeParameter('lazy_load_images', i, false) as boolean;
                    parameters['use_print'] = this.getNodeParameter('use_print', i, false) as boolean;
                    parameters['disable_javascript'] = this.getNodeParameter('disable_javascript', i, false) as boolean;

                    const cssParameter = this.getNodeParameter('css', i) as string;
                    if (cssParameter) {
                        parameters['css'] = cssParameter
                    }

                    const javascriptParameter = this.getNodeParameter('javascript', i) as string;
                    if (javascriptParameter) {
                        parameters['javascript'] = javascriptParameter
                    }
                }

                if (parameters.is_gdpr && parameters.filename && !parameters.s3_destination) {
                    throw new NodeOperationError(this.getNode(),
                        'A JSON response for a sensitive document requires an S3 Destination (GDPR/BAA forbids storing the file on PDFShift).',
                        { itemIndex: i });
                }

                const data = await PDFShiftRequest({
                    endpoint,
                    parameters,
                    requestWithAuthentication
                });

                if (binaryResponse) {
                    if (parameters.encode) {
                        // API returned base64 text (see PDFShiftApi.ts) — surface it as JSON, not a binary file
                        results.push({
                            json: { data: data as string, filename: 'generated' + extension, mimetype },
                            pairedItem: { item: i },
                        });
                    } else {
                        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as string);
                        const binaryData = await this.helpers.prepareBinaryData(
                            buffer,
                            'generated' + extension,
                            mimetype,
                        );
                        results.push({
                            json: {},
                            binary: { data: binaryData },
                            pairedItem: { item: i },
                        });
                    }
                } else {
                    results.push({ json: (data as IDataObject) || {}, pairedItem: { item: i } });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    results.push({
                        json: { error: getErrorMessage(error) },
                        pairedItem: { item: i },
                    });
                    continue;
                }

                if (error instanceof NodeOperationError) {
                    throw new NodeOperationError(
                        this.getNode(),
                        { message: getErrorMessage(error) },
                        { itemIndex: i },
                    );
                }

                throw new NodeApiError(
                    this.getNode(),
                    { message: getErrorMessage(error) },
                    { itemIndex: i },
                );
            }
        }
        return [results];
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}
