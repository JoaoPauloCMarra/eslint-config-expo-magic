type CardProps = {
	onPress?: () => void;
	title: string;
};

type CardWithChildrenProps = {
	children: React.ReactNode;
	title: string;
};

export function Card(props: CardProps) {
	return <>{props.title}</>;
}

export function CardWithChildren(props: CardWithChildrenProps) {
	return <>{props.title}</>;
}

function InlineCard(props: { title: string }) {
	return <>{props.title}</>;
}

const helper = () => 'helpers belong after default export';

export default Card;
