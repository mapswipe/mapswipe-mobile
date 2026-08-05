import PageIndicator from '@/components/ui/PageIndicator';

interface Props {
    total: number;
    currentIndex: number;
}

function StageIndicator(props: Props) {
    const { total, currentIndex } = props;

    return (
        <PageIndicator
            count={total}
            currentIndex={currentIndex}
            colorVariant="onBrand"
            styleVariant="expanded"
        />
    );
}

export default StageIndicator;
