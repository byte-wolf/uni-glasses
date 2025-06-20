<script lang="ts">
	type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

	interface Props {
		variant?: ButtonVariant;
		class?: string;
		disabled?: boolean;
		onclick?: () => void;
		children: any;
	}

	let {
		variant = 'primary',
		class: className = '',
		disabled = false,
		onclick,
		children
	}: Props = $props();

	const baseClasses =
		'rounded-2xl px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-primary text-white hover:bg-primary/90',
		secondary: 'bg-btn-secondary text-primary-text hover:bg-btn-secondary/80',
		tertiary: 'bg-background-secondary text-primary-text hover:bg-background-secondary/80'
	};
</script>

<button class="{baseClasses} {variantClasses[variant]} {className}" {disabled} {onclick}>
	{@render children()}
</button>
