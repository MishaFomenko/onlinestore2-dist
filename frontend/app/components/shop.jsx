'use client';
import ProductCard from './productCard';
import { useEffect, useState } from 'react';
import { customGetter } from '../utils/fetchConstructor';
import useSWR from 'swr';
import Spinner from './spinner';
import ErrorComponent from './errorComponent';

export default function Shop() {
    const [bs, setBs] = useState([]);
    const bestsPath = `${process.env.NEXT_PUBLIC_PUBLIC_IP}:${process.env.NEXT_PUBLIC_SERVER_PORT}/api/products`;
    const bestsAction = 'homepage';
    const bestsRequestPath = `${bestsPath}?action=${bestsAction}`;
    const { data, error, isLoading } = useSWR(bestsRequestPath, customGetter);

    useEffect(() => {
        !isLoading && setBs(data);
    }, [data, isLoading]);

    return (
        <>
            {!isLoading && !data && error
                ?
                <ErrorComponent />
                :
                isLoading
                    ?
                    <div className='flex justify-center items-center h-screen'>
                        <Spinner />
                    </div>
                    :
                    <>
                        <div className='h-16 bg-blue-400 flex items-center p-6'>Recommended products</div>
                        <div className='flex flex-wrap'>
                            {!isLoading && bs.map((item) => <ProductCard key={item.asin} item={item} />)}
                        </div>
                    </>
            };
        </>

    );
};
