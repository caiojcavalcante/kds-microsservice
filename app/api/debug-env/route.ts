import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

export async function GET() {
    // 1. Check process.env directly
    const directKey = process.env.ASAAS_API_KEY;

    // 2. Try to verify .env.local existence and content length (securely)
    const envPath = path.resolve(process.cwd(), '.env.local');
    let fileExists = false;
    let fileContentLength = 0;
    let keyInFile = null;

    try {
        if (fs.existsSync(envPath)) {
            fileExists = true;
            const rawContent = fs.readFileSync(envPath, 'utf8');
            fileContentLength = rawContent.length;

            const parsed = dotenv.parse(rawContent);
            if (parsed.ASAAS_API_KEY) {
                keyInFile = parsed.ASAAS_API_KEY.substring(0, 5) + '...';
            }
        }
    } catch (e) {
        console.error("Error reading .env.local:", e);
    }

    return NextResponse.json({
        env_var_loaded: !!directKey,
        env_var_preview: directKey ? directKey.substring(0, 5) + '...' : 'undefined',
        file_exists: fileExists,
        file_path: envPath,
        manual_parse_found: !!keyInFile,
        manual_parse_preview: keyInFile,
        node_env: process.env.NODE_ENV
    });
}
