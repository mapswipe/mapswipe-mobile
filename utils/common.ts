export const MIN_USERNAME_LENGTH = 4;

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

export function validateUserName(name: string | undefined) {
    if (!name || name.length < MIN_USERNAME_LENGTH) {
        return false;
    }

    // NOTE: this validation mirror is also used in firebase function
    // python-mapswipe-workers/firebase/functions/src/utils/index.ts
    const removeUserNameSpace = name.replace(/\s+/g, '');
    const newUserName = removeUserNameSpace.toLowerCase();

    return newUserName === name;
}
