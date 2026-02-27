/* eslint-disable import/prefer-default-export */
export function getProjectProgressForDisplay(progress: number): string {
    let finalProgress: string;

    if (progress < 99) {
        finalProgress = Math.max(0, progress).toFixed(0);
    } else if (progress < 100) {
        finalProgress = '99';
    } else {
        finalProgress = '100';
    }
    return finalProgress;
}
