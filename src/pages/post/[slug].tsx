import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const [timeToRead, setTimeToRead] = useState('');
  const [contentBody, setContentBody] = useState([]);
  const [loading, setLoading] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.isFallback) {
      setLoading('Carregando...');
    }

    if (post) {
      const contentHtml = post.data.content.map(content => {
        return {
          heading: content.heading,
          body: RichText.asHtml(content.body),
        };
      });
      setContentBody(contentHtml);
      const bodyContent = contentHtml
        .map(text => text.heading + text.body)
        .toString();
      const letterNums = bodyContent.split(' ').length;
      const estimatedTime = Math.ceil(letterNums / 200);
      setTimeToRead(`${estimatedTime} min`);
    }
  }, [post, router.isFallback]);

  return (
    <>
      {loading ?? <p>{loading}</p>}
      {post && (
        <>
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt={post.data.title} />
          </div>
          <div className={commonStyles.container}>
            <h1>{post.data.title}</h1>
            <div className={commonStyles.infoWrapper}>
              <time>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                  locale: ptBR,
                })}
              </time>
              <p>
                <FiUser /> {post.data.author}
              </p>
              <p>
                <FiClock /> {timeToRead}
              </p>
            </div>
            {contentBody.map(content => {
              return (
                <div key={content.heading} className={styles.content}>
                  <h2>{content.heading}</h2>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: content.body.toString(),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { fetch: ['posts.uid'] }
  );

  const paths = postsResponse.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
