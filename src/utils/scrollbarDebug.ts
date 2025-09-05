/**
 * Debug utility to help identify scrollbar issues on Windows
 * Add this temporarily to your components to test scrollbar fixes
 */

export const debugScrollbars = () => {
    if (typeof document === 'undefined') return;

    console.log('=== Scrollbar Debug Info ===');

    // Find all scrollable elements
    const scrollableElements = document.querySelectorAll([
        '.overflow-auto',
        '.overflow-y-auto',
        '.overflow-x-auto',
        '.overflow-scroll',
        '.overflow-y-scroll',
        '.overflow-x-scroll',
        '[class*="overflow"]'
    ].join(','));

    console.log(`Found ${scrollableElements.length} potentially scrollable elements`);

    scrollableElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const pseudoStyles = window.getComputedStyle(element, '::-webkit-scrollbar-track');

        console.log(`Element ${index}:`, {
            element: element.tagName,
            classes: element.className,
            overflow: styles.overflow,
            overflowY: styles.overflowY,
            overflowX: styles.overflowX,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            isScrollable: element.scrollHeight > element.clientHeight,
            trackBackground: pseudoStyles.backgroundColor
        });
    });

    // Check if platform class is applied
    const hasPlatformClass = document.body.classList.contains('platform-windows');
    console.log('Platform-windows class applied:', hasPlatformClass);

    // Check for CSS rules
    const styleSheets = Array.from(document.styleSheets);
    const hasScrollbarRules = styleSheets.some(sheet => {
        try {
            return Array.from(sheet.cssRules || []).some(rule =>
                rule.cssText.includes('webkit-scrollbar-track')
            );
        } catch (e) {
            return false;
        }
    });
    console.log('Scrollbar CSS rules found:', hasScrollbarRules);
    console.log('=== End Debug Info ===');
};

// Call this in browser console: window.debugScrollbars()
if (typeof window !== 'undefined') {
    (window as any).debugScrollbars = debugScrollbars;
}
