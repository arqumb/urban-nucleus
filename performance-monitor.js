#!/usr/bin/env node

/**
 * Urban Nucleus Performance Monitor
 * Automated Lighthouse testing and performance tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceMonitor {
    constructor() {
        this.baseUrl = 'http://31.97.239.99';
        this.reportsDir = './performance-reports';
        this.pages = [
            { name: 'home', url: '' },
            { name: 'product-detail', url: '/product-detail.html?id=1' },
            { name: 'category', url: '/category.html?id=1' },
            { name: 'cart', url: '/cart.html' }
        ];
        this.init();
    }

    init() {
        this.createReportsDirectory();
        this.checkLighthouseCLI();
    }

    createReportsDirectory() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    checkLighthouseCLI() {
        try {
            execSync('lighthouse --version', { stdio: 'pipe' });
            console.log('✅ Lighthouse CLI is available');
        } catch (error) {
            console.log('❌ Lighthouse CLI not found');
            console.log('💡 Install with: npm install -g lighthouse');
            this.createManualTestGuide();
            return false;
        }
        return true;
    }

    async runLighthouseTests() {
        console.log('🚀 Running Lighthouse Performance Tests');
        console.log('=====================================\n');

        const results = [];

        for (const page of this.pages) {
            console.log(`🔍 Testing ${page.name}...`);
            
            const result = await this.runLighthouseForPage(page);
            results.push(result);
            
            console.log(`✅ ${page.name} test completed\n`);
        }

        this.generateSummaryReport(results);
        return results;
    }

    async runLighthouseForPage(page) {
        const url = `${this.baseUrl}${page.url}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(this.reportsDir, `${page.name}-${timestamp}`);

        try {
            const command = `lighthouse "${url}" ` +
                `--output json --output html ` +
                `--output-path "${outputPath}" ` +
                `--chrome-flags="--headless --no-sandbox" ` +
                `--quiet`;

            execSync(command, { stdio: 'pipe' });

            // Read the JSON report
            const jsonReport = JSON.parse(fs.readFileSync(`${outputPath}.report.json`, 'utf8'));
            
            return {
                page: page.name,
                url: url,
                timestamp: timestamp,
                scores: this.extractScores(jsonReport),
                metrics: this.extractMetrics(jsonReport),
                reportPath: `${outputPath}.report.html`
            };

        } catch (error) {
            console.error(`❌ Error testing ${page.name}:`, error.message);
            return {
                page: page.name,
                url: url,
                error: error.message
            };
        }
    }

    extractScores(report) {
        const categories = report.lhr.categories;
        return {
            performance: Math.round(categories.performance.score * 100),
            accessibility: Math.round(categories.accessibility.score * 100),
            bestPractices: Math.round(categories['best-practices'].score * 100),
            seo: Math.round(categories.seo.score * 100)
        };
    }

    extractMetrics(report) {
        const audits = report.lhr.audits;
        return {
            firstContentfulPaint: audits['first-contentful-paint'].numericValue,
            largestContentfulPaint: audits['largest-contentful-paint'].numericValue,
            cumulativeLayoutShift: audits['cumulative-layout-shift'].numericValue,
            totalBlockingTime: audits['total-blocking-time'].numericValue,
            speedIndex: audits['speed-index'].numericValue,
            timeToInteractive: audits['interactive'].numericValue
        };
    }

    generateSummaryReport(results) {
        const summary = {
            timestamp: new Date().toISOString(),
            totalPages: results.length,
            averageScores: this.calculateAverageScores(results),
            pageResults: results,
            recommendations: this.generateRecommendations(results)
        };

        const summaryPath = path.join(this.reportsDir, `summary-${Date.now()}.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        console.log('📊 Performance Summary Report');
        console.log('============================');
        console.log(`📈 Average Performance Score: ${summary.averageScores.performance}/100`);
        console.log(`♿ Average Accessibility Score: ${summary.averageScores.accessibility}/100`);
        console.log(`✅ Average Best Practices Score: ${summary.averageScores.bestPractices}/100`);
        console.log(`🔍 Average SEO Score: ${summary.averageScores.seo}/100`);
        console.log(`\n📁 Detailed reports saved in: ${this.reportsDir}`);
        console.log(`📋 Summary report: ${summaryPath}`);

        this.displayRecommendations(summary.recommendations);
    }

    calculateAverageScores(results) {
        const validResults = results.filter(r => !r.error);
        if (validResults.length === 0) return {};

        const totals = validResults.reduce((acc, result) => {
            acc.performance += result.scores.performance;
            acc.accessibility += result.scores.accessibility;
            acc.bestPractices += result.scores.bestPractices;
            acc.seo += result.scores.seo;
            return acc;
        }, { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 });

        return {
            performance: Math.round(totals.performance / validResults.length),
            accessibility: Math.round(totals.accessibility / validResults.length),
            bestPractices: Math.round(totals.bestPractices / validResults.length),
            seo: Math.round(totals.seo / validResults.length)
        };
    }

    generateRecommendations(results) {
        const recommendations = [];
        const validResults = results.filter(r => !r.error);

        // Performance recommendations
        const avgPerformance = this.calculateAverageScores(validResults).performance;
        if (avgPerformance < 90) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: `Average performance score is ${avgPerformance}/100`,
                solution: 'Implement image optimization, minify resources, enable compression'
            });
        }

        // Check for slow metrics
        validResults.forEach(result => {
            if (result.metrics.largestContentfulPaint > 2500) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'High',
                    issue: `${result.page} has slow LCP: ${Math.round(result.metrics.largestContentfulPaint)}ms`,
                    solution: 'Optimize images, reduce server response time, eliminate render-blocking resources'
                });
            }

            if (result.metrics.cumulativeLayoutShift > 0.1) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'Medium',
                    issue: `${result.page} has layout shift: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`,
                    solution: 'Add size attributes to images, reserve space for dynamic content'
                });
            }
        });

        return recommendations;
    }

    displayRecommendations(recommendations) {
        if (recommendations.length === 0) {
            console.log('\n🎉 No major issues found!');
            return;
        }

        console.log('\n🔧 Performance Recommendations:');
        console.log('===============================');

        recommendations.forEach((rec, index) => {
            console.log(`\n${index + 1}. ${rec.category} (${rec.priority} Priority)`);
            console.log(`   Issue: ${rec.issue}`);
            console.log(`   Solution: ${rec.solution}`);
        });
    }

    createManualTestGuide() {
        const guide = `
# Urban Nucleus Performance Testing Guide

## Automated Testing (Requires Lighthouse CLI)

1. Install Lighthouse CLI:
   \`\`\`bash
   npm install -g lighthouse
   \`\`\`

2. Run performance tests:
   \`\`\`bash
   node performance-monitor.js
   \`\`\`

## Manual Testing

### 1. Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" category
4. Click "Generate report"

### 2. PageSpeed Insights
1. Visit: https://pagespeed.web.dev/
2. Enter your website URL
3. Click "Analyze"

### 3. GTmetrix
1. Visit: https://gtmetrix.com/
2. Enter your website URL
3. Click "Test your site"

## Key Metrics to Monitor

- **Performance Score**: Target 90+
- **First Contentful Paint**: Target < 1.8s
- **Largest Contentful Paint**: Target < 2.5s
- **Cumulative Layout Shift**: Target < 0.1
- **Total Blocking Time**: Target < 300ms

## Performance Optimizations Already Implemented

✅ Database caching system
✅ Image lazy loading
✅ Resource preconnection
✅ CSS/JS minification
✅ Mobile optimizations
✅ Professional typography

## Next Steps

1. Install Sharp for image optimization
2. Implement CDN integration
3. Enable compression
4. Monitor Core Web Vitals
`;

        fs.writeFileSync('PERFORMANCE_TESTING_GUIDE.md', guide);
        console.log('📋 Created manual testing guide: PERFORMANCE_TESTING_GUIDE.md');
    }

    // Real-time performance monitoring
    setupRealTimeMonitoring() {
        const monitoringScript = `
// Real-time performance monitoring
(function() {
    // Monitor Core Web Vitals
    function measureCoreWebVitals() {
        // First Input Delay
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log('FID:', entry.processingStart - entry.startTime);
            }
        }).observe({type: 'first-input', buffered: true});

        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({type: 'largest-contentful-paint', buffered: true});

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    console.log('CLS:', clsValue);
                }
            }
        }).observe({type: 'layout-shift', buffered: true});
    }

    // Initialize monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', measureCoreWebVitals);
    } else {
        measureCoreWebVitals();
    }
})();
`;

        fs.writeFileSync('real-time-monitoring.js', monitoringScript);
        console.log('📊 Created real-time monitoring script: real-time-monitoring.js');
    }
}

// Run performance tests if called directly
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    
    if (process.argv.includes('--setup-monitoring')) {
        monitor.setupRealTimeMonitoring();
    } else {
        monitor.runLighthouseTests().catch(console.error);
    }
}

module.exports = PerformanceMonitor;







