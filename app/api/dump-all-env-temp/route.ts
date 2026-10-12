import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('token') !== 'mehedi-unlock-all-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const systemIgnoreList = [
    'PATH', 'NODE_VERSION', 'YARN_VERSION', 'PWD', 'HOME', 'USER',
    'SHLVL', '_', 'HOSTNAME', 'LD_LIBRARY_PATH', 'AWS_LAMBDA_FUNCTION_NAME',
    'AWS_REGION', 'LAMBDA_TASK_ROOT', 'AWS_EXECUTION_ENV'
  ];

  let envFileContent = '';

  for (const [key, value] of Object.entries(process.env)) {
    if (!systemIgnoreList.includes(key) && value !== undefined) {
      envFileContent += `${key}="${value}"\n`;
    }
  }

  return new NextResponse(envFileContent, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
