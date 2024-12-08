/**
 * External dependencies
 */
import { useSortable } from '@dnd-kit/sortable';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { DragHandleContext } from './sortable-drag-handle';

export const SortableItem = ( {
	id,
	className = '',
	children,
	...props
}: {
	id: string;
	className?: string;
	children: React.ReactNode;
} ) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id } );

	const style = {
		transform: transform
			? `translate3d(${ transform.x }px, ${ transform.y }px, 0)`
			: undefined,
		transition,
	};

	const sortableItemClassName = clsx(
		'sortable-item',
		className ?? '',
		isDragging ? 'is-dragging' : ''
	);

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className={ sortableItemClassName }
			{ ...props }
		>
			<DragHandleContext.Provider value={ { attributes, listeners } }>
				{ children }
			</DragHandleContext.Provider>
		</div>
	);
};
