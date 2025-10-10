// Progress Rings System
class ProgressRingManager {
    constructor() {
        this.rings = new Map();
        this.init();
    }

    init() {
        this.setupStyles();
        this.setupProgressRings();
    }

    setupStyles() {
        if (document.getElementById('progress-ring-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'progress-ring-styles';
        styles.textContent = `
            /* Progress ring styles */
            .progress-ring {
                position: relative;
                display: inline-block;
                width: 120px;
                height: 120px;
            }

            .progress-ring svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }

            .progress-ring-circle {
                fill: none;
                stroke-width: 8;
                stroke-linecap: round;
                transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .progress-ring-bg {
                stroke: var(--bg-tertiary);
                stroke-width: 8;
            }

            .progress-ring-fill {
                stroke: var(--primary-color);
                stroke-dasharray: 283;
                stroke-dashoffset: 283;
            }

            .progress-ring-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                font-weight: 600;
            }

            .progress-ring-percentage {
                font-size: 1.5rem;
                color: var(--text-primary);
            }

            .progress-ring-label {
                font-size: 0.75rem;
                color: var(--text-secondary);
                margin-top: 0.25rem;
            }

            /* Progress ring sizes */
            .progress-ring.small {
                width: 80px;
                height: 80px;
            }

            .progress-ring.small .progress-ring-circle {
                stroke-width: 6;
            }

            .progress-ring.small .progress-ring-bg {
                stroke-width: 6;
            }

            .progress-ring.small .progress-ring-percentage {
                font-size: 1.125rem;
            }

            .progress-ring.large {
                width: 160px;
                height: 160px;
            }

            .progress-ring.large .progress-ring-circle {
                stroke-width: 10;
            }

            .progress-ring.large .progress-ring-bg {
                stroke-width: 10;
            }

            .progress-ring.large .progress-ring-percentage {
                font-size: 2rem;
            }

            /* Progress ring colors */
            .progress-ring.primary .progress-ring-fill {
                stroke: var(--primary-color);
            }

            .progress-ring.success .progress-ring-fill {
                stroke: var(--success-color);
            }

            .progress-ring.warning .progress-ring-fill {
                stroke: var(--warning-color);
            }

            .progress-ring.error .progress-ring-fill {
                stroke: var(--error-color);
            }

            .progress-ring.info .progress-ring-fill {
                stroke: var(--info-color);
            }

            .progress-ring.accent .progress-ring-fill {
                stroke: var(--accent-color);
            }

            /* Progress ring animations */
            .progress-ring.animate .progress-ring-fill {
                animation: progressRingFill 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            @keyframes progressRingFill {
                from {
                    stroke-dashoffset: 283;
                }
                to {
                    stroke-dashoffset: var(--progress-offset);
                }
            }

            /* Progress ring with icon */
            .progress-ring-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.5rem;
                color: var(--primary-color);
            }

            .progress-ring.small .progress-ring-icon {
                font-size: 1rem;
            }

            .progress-ring.large .progress-ring-icon {
                font-size: 2rem;
            }

            /* Progress ring group */
            .progress-ring-group {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 2rem;
                margin: 2rem 0;
            }

            .progress-ring-group.compact {
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 1rem;
            }

            .progress-ring-group.large {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 3rem;
            }

            /* Progress ring card */
            .progress-ring-card {
                background: var(--bg-primary);
                border-radius: 0.75rem;
                padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                text-align: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .progress-ring-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            [data-theme="dark"] .progress-ring-card:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .progress-ring-card-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 1rem;
            }

            .progress-ring-card-description {
                font-size: 0.75rem;
                color: var(--text-tertiary);
                margin-top: 0.5rem;
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .progress-ring-group {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .progress-ring-group.large {
                    grid-template-columns: 1fr;
                }

                .progress-ring-card:hover {
                    transform: none;
                }
            }

            /* Progress ring with multiple segments */
            .progress-ring-multi {
                position: relative;
            }

            .progress-ring-multi .progress-ring-segment {
                stroke-dasharray: var(--segment-length);
                stroke-dashoffset: var(--segment-offset);
                transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .progress-ring-segment-1 {
                stroke: var(--primary-color);
            }

            .progress-ring-segment-2 {
                stroke: var(--success-color);
            }

            .progress-ring-segment-3 {
                stroke: var(--warning-color);
            }

            .progress-ring-segment-4 {
                stroke: var(--error-color);
            }
        `;
        document.head.appendChild(styles);
    }

    setupProgressRings() {
        // Find existing progress bars and convert them to rings
        const progressBars = document.querySelectorAll('.progress-bar, .w-full.bg-gray-200');
        progressBars.forEach(bar => {
            this.convertToRing(bar);
        });

        // Find progress elements in tables and convert them
        const progressElements = document.querySelectorAll('[data-progress], .progress');
        progressElements.forEach(element => {
            this.convertToRing(element);
        });
    }

    convertToRing(element) {
        const progress = this.extractProgress(element);
        if (progress === null) return;

        const ring = this.createProgressRing({
            percentage: progress,
            size: 'small',
            color: this.getProgressColor(progress),
            label: this.extractLabel(element)
        });

        element.parentNode.replaceChild(ring, element);
    }

    extractProgress(element) {
        // Try to extract progress from various attributes and classes
        const progressAttr = element.getAttribute('data-progress');
        if (progressAttr) return parseInt(progressAttr);

        const style = element.style;
        if (style.width && style.width.includes('%')) {
            return parseInt(style.width);
        }

        const classList = Array.from(element.classList);
        const progressClass = classList.find(cls => cls.startsWith('w-'));
        if (progressClass) {
            const match = progressClass.match(/w-(\d+)/);
            if (match) {
                return parseInt(match[1]) * 4; // Convert Tailwind width to percentage
            }
        }

        return null;
    }

    extractLabel(element) {
        const labelAttr = element.getAttribute('data-label');
        if (labelAttr) return labelAttr;

        const textContent = element.textContent.trim();
        if (textContent && !textContent.match(/^\d+%$/)) {
            return textContent;
        }

        return null;
    }

    getProgressColor(percentage) {
        if (percentage >= 80) return 'success';
        if (percentage >= 60) return 'info';
        if (percentage >= 40) return 'warning';
        return 'error';
    }

    createProgressRing(options = {}) {
        const {
            percentage = 0,
            size = 'normal',
            color = 'primary',
            label = null,
            icon = null,
            animated = true,
            showPercentage = true
        } = options;

        const radius = this.getRadius(size);
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        const ring = document.createElement('div');
        ring.className = `progress-ring ${size} ${color} ${animated ? 'animate' : ''}`;
        ring.style.setProperty('--progress-offset', offset);

        let content = '';
        if (icon) {
            content = `<div class="progress-ring-icon"><i class="${icon}"></i></div>`;
        } else if (showPercentage) {
            content = `
                <div class="progress-ring-text">
                    <div class="progress-ring-percentage">${percentage}%</div>
                    ${label ? `<div class="progress-ring-label">${label}</div>` : ''}
                </div>
            `;
        }

        ring.innerHTML = `
            <svg>
                <circle class="progress-ring-circle progress-ring-bg" 
                        cx="50%" cy="50%" r="${radius}"></circle>
                <circle class="progress-ring-circle progress-ring-fill" 
                        cx="50%" cy="50%" r="${radius}"></circle>
            </svg>
            ${content}
        `;

        // Store ring reference
        this.rings.set(ring, { percentage, options });

        return ring;
    }

    getRadius(size) {
        const sizes = {
            small: 30,
            normal: 50,
            large: 70
        };
        return sizes[size] || sizes.normal;
    }

    updateProgress(ring, newPercentage) {
        const ringData = this.rings.get(ring);
        if (!ringData) return;

        const circumference = 2 * Math.PI * this.getRadius(ringData.options.size);
        const offset = circumference - (newPercentage / 100) * circumference;

        ring.style.setProperty('--progress-offset', offset);
        
        const percentageElement = ring.querySelector('.progress-ring-percentage');
        if (percentageElement) {
            percentageElement.textContent = `${newPercentage}%`;
        }

        // Update color if needed
        const newColor = this.getProgressColor(newPercentage);
        ring.className = ring.className.replace(/progress-ring-\w+/, `progress-ring-${newColor}`);

        // Update stored data
        ringData.percentage = newPercentage;
    }

    createProgressRingGroup(rings) {
        const group = document.createElement('div');
        group.className = 'progress-ring-group';

        rings.forEach(ringOptions => {
            const ring = this.createProgressRing(ringOptions);
            group.appendChild(ring);
        });

        return group;
    }

    createProgressRingCard(options = {}) {
        const {
            title = 'Progress',
            percentage = 0,
            description = null,
            size = 'normal',
            color = 'primary',
            icon = null
        } = options;

        const card = document.createElement('div');
        card.className = 'progress-ring-card';

        const ring = this.createProgressRing({
            percentage,
            size,
            color,
            icon,
            showPercentage: !icon
        });

        card.innerHTML = `
            <div class="progress-ring-card-title">${title}</div>
            ${ring.outerHTML}
            ${description ? `<div class="progress-ring-card-description">${description}</div>` : ''}
        `;

        return card;
    }

    createMultiSegmentRing(segments) {
        const total = segments.reduce((sum, seg) => sum + seg.value, 0);
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        
        let currentOffset = circumference;
        const segmentElements = segments.map((segment, index) => {
            const segmentLength = (segment.value / total) * circumference;
            const segmentOffset = currentOffset - segmentLength;
            
            const element = `
                <circle class="progress-ring-circle progress-ring-segment progress-ring-segment-${index + 1}" 
                        cx="50%" cy="50%" r="${radius}"
                        style="stroke-dasharray: ${segmentLength}; stroke-dashoffset: ${segmentOffset};">
                </circle>
            `;
            
            currentOffset = segmentOffset;
            return element;
        }).join('');

        const ring = document.createElement('div');
        ring.className = 'progress-ring large multi-segment';
        ring.innerHTML = `
            <svg>
                <circle class="progress-ring-circle progress-ring-bg" 
                        cx="50%" cy="50%" r="${radius}"></circle>
                ${segmentElements}
            </svg>
            <div class="progress-ring-text">
                <div class="progress-ring-percentage">${total}</div>
            </div>
        `;

        return ring;
    }

    // Animate all rings
    animateAll() {
        this.rings.forEach((ringData, ring) => {
            ring.classList.add('animate');
        });
    }

    // Get all rings
    getAllRings() {
        return Array.from(this.rings.keys());
    }
}

// Initialize progress ring manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.progressRingManager = new ProgressRingManager();
});

// Export for global access
window.ProgressRingManager = ProgressRingManager;
