import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    if (postsPagination) {
      setPosts(postsPagination.results);
      setNextPage(postsPagination.next_page);
    }
  }, [postsPagination]);

  async function handleNextPage(nextLink: string): Promise<void> {
    const response = await fetch(nextLink);
    const json = await response.json();
    const postsNextPage = json?.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
    setPosts(prevState => {
      const joinArr = prevState.concat(postsNextPage);
      return joinArr;
    });
    setNextPage(json.next_page);
  }

  return (
    <main>
      <div>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                    locale: ptBR,
                  })}
                </time>
                <p>{post.data.author}</p>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button onClick={() => handleNextPage(nextPage)} type="button">
            Carregar mais posts
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { fetch: ['posts.title', 'posts.subtitle', 'posts.author'], pageSize: 1 }
  );

  const posts = postsResponse?.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: { results: posts, next_page: postsResponse.next_page },
    },
  };
};
