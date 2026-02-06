#!/usr/bin/env ts-node

/**
 * Script to copy APK files with git commit hash in filename
 * Usage: ts-node scripts/copy-apk.ts [debug|release]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type BuildType = 'debug' | 'release';

interface ApkCopyResult {
    success: boolean;
    sourcePath: string;
    destinationPath?: string;
    fileSize?: number;
    gitHash?: string;
}

function getGitCommitHash(): string {
    try {
        const hash = execSync('git rev-parse --short HEAD', { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..') // Run from project root
        }).trim();
        return hash;
    } catch (error) {
        console.warn('⚠️ Warning: Could not get git commit hash. Using "nogit" instead.');
        return 'nogit';
    }
}

function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dirPath}`);
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyApk(buildType: BuildType): ApkCopyResult {
    const gitHash = getGitCommitHash();

    const sourcePath = path.join(
        __dirname,
        '..',
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        buildType,
        `app-${buildType}.apk`
    );

    const outputDir = path.join(__dirname, '..', 'generated');
    ensureDirectoryExists(outputDir);

    const destinationFilename = `app-${buildType}-${gitHash}.apk`;
    const destinationPath = path.join(outputDir, destinationFilename);

    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
        console.error(`✗ Error: APK not found at ${sourcePath}`);
        console.error(`  Make sure the build completed successfully.`);
        return {
            success: false,
            sourcePath
        };
    }

    // Copy the file
    try {
        fs.copyFileSync(sourcePath, destinationPath);
        const stats = fs.statSync(destinationPath);
        const fileSize = stats.size;

        console.log(`✓ Successfully copied ${buildType} APK`);
        console.log(`  Source: ${sourcePath}`);
        console.log(`  Destination: ${destinationPath}`);
        console.log(`  Size: ${formatBytes(fileSize)}`);
        console.log(`  Git Hash: ${gitHash}`);

        return {
            success: true,
            sourcePath,
            destinationPath,
            fileSize,
            gitHash
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ Error copying APK: ${errorMessage}`);
        return {
            success: false,
            sourcePath
        };
    }
}

/**
 * Main execution
 */
function main(): void {
    const buildType = process.argv[2] as BuildType | undefined;

    console.log('\n📦 APK Copy Script');
    console.log('='.repeat(50));

    if (!buildType || (buildType !== 'debug' && buildType !== 'release')) {
        console.error(`✗ Invalid or missing build type: ${buildType || 'none'}`);
        console.error('  Usage: ts-node scripts/copy-apk.ts [debug|release]\n');
        process.exit(1);
    }

    const result = copyApk(buildType);
    console.log('='.repeat(50) + '\n');

    process.exit(result.success ? 0 : 1);
}

main();
