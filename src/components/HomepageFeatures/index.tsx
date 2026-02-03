import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    image: string;
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Type-Safe by Design',
        image: require('@site/static/img/kronos_arrow.png').default,
        description: (
            <>
                Write strategies with full IDE autocomplete and compile-time guarantees.
                Catch errors before they reach production.
            </>
        ),
    },
    {
        title: 'Focus on Strategy Logic',
        image: require('@site/static/img/kronos_target.png').default,
        description: (
            <>
                Don't worry about exchange APIs or data management. Focus on writing
                your strategies, wisp handles the rest.
            </>
        ),
    },
    {
        title: 'Write Once, Run Anywhere',
        image: require('@site/static/img/kronos_result.png').default,
        description: (
            <>
                Same code works in backtesting and live trading. No environment-specific
                logic. No adapter layers.
            </>
        ),
    },
];

function Feature({title, description}: FeatureItem) {
    return (
        <div className={styles.featureCard}>
            <Heading as="h3">{title}</Heading>
            <p>{description}</p>
        </div>
    );
}

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (
        <header className={styles.heroBanner}>
            <div className="container">
                <Heading as="h1">{siteConfig.title}</Heading>
                <p>{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className={clsx('button button--secondary button--lg', styles.heroButton)}
                        to="/docs/getting-started">
                        Get Started →
                    </Link>
                </div>
            </div>
        </header>
    );
}


function HomepageFeatures(): ReactNode {
    return (
        <section className={styles.features}>
            {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
            ))}
        </section>
    );
}

export default function Home(): ReactNode {
    return (
        <div>
            <HomepageHeader/>
            <HomepageFeatures/>
        </div>
    );
}
