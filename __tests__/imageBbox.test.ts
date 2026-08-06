import projectBbox from '@/utils/imageBbox';

const SQUARE = {
    naturalWidth: 100,
    naturalHeight: 100,
    clientWidth: 100,
    clientHeight: 100,
};

describe('projectBbox', () => {
    it('is the identity when the image exactly fills a matching container', () => {
        expect(projectBbox(SQUARE, [10, 20, 30, 40])).toEqual({
            x: 10, y: 20, width: 30, height: 40,
        });
    });

    it('scales with the container', () => {
        expect(projectBbox({ ...SQUARE, clientWidth: 200, clientHeight: 200 }, [10, 20, 30, 40]))
            .toEqual({
                x: 20, y: 40, width: 60, height: 80,
            });
    });

    it('centres the letterbox on the block axis', () => {
        const result = projectBbox({
            naturalWidth: 200,
            naturalHeight: 100,
            clientWidth: 200,
            clientHeight: 200,
        }, [0, 0, 200, 100]);

        expect(result).toEqual({
            x: 0, y: 50, width: 200, height: 100,
        });
    });

    it('centres the letterbox on the inline axis', () => {
        const result = projectBbox({
            naturalWidth: 100,
            naturalHeight: 200,
            clientWidth: 200,
            clientHeight: 200,
        }, [0, 0, 100, 200]);

        expect(result).toEqual({
            x: 50, y: 0, width: 100, height: 200,
        });
    });

    it('only ever letterboxes one axis', () => {
        const wide = projectBbox({
            naturalWidth: 400, naturalHeight: 100, clientWidth: 200, clientHeight: 200,
        }, [0, 0, 400, 100]);
        const tall = projectBbox({
            naturalWidth: 100, naturalHeight: 400, clientWidth: 200, clientHeight: 200,
        }, [0, 0, 100, 400]);

        expect(wide?.x).toBe(0);
        expect(tall?.y).toBe(0);
        expect(wide?.y).toBeGreaterThan(0);
        expect(tall?.x).toBeGreaterThan(0);
    });

    it('keeps a corner bbox in the corner', () => {
        expect(projectBbox(SQUARE, [90, 90, 10, 10])).toEqual({
            x: 90, y: 90, width: 10, height: 10,
        });
    });

    it.each([
        ['an unmeasured container', { ...SQUARE, clientWidth: 0 }],
        ['an unmeasured image', { ...SQUARE, naturalHeight: 0 }],
    ] as const)('returns undefined for %s', (_label, box) => {
        expect(projectBbox(box, [0, 0, 1, 1])).toBeUndefined();
    });

    it.each([
        ['no bbox', undefined],
        ['a short bbox', [1, 2, 3]],
    ] as const)('returns undefined for %s', (_label, bbox) => {
        expect(projectBbox(SQUARE, bbox)).toBeUndefined();
    });
});
