'use client'
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import Image from 'next/image'
import { CourseDetailType } from '@/app/types/coursedetail'
import withBasePath from '@/utils/basePath'
import CourseDetailSkeleton from '../../Skeleton/CourseDetail'
import Link from 'next/link'

interface Name {
    imageSrc: string
    course: string
    price: string
    profession: string
    category:
    | 'webdevelopment'
    | 'mobiledevelopment'
    | 'datascience'
    | 'cloudcomputing'
}

const NamesList = () => {
    // -------------------------------------------------------------
    const [courseDetail, setCourseDetail] = useState<CourseDetailType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(withBasePath('/data/data.json'))
                if (!res.ok) throw new Error('Failed to fetch.')
                const data = await res.json()
                setCourseDetail(data.CourseDetailData)
            } catch (error) {
                console.error('Error fetching services:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])
    // -------------------------------------------------------------

    const [selectedButton, setSelectedButton] = useState<
        | 'mobiledevelopment'
        | 'webdevelopment'
        | 'datascience'
        | 'cloudcomputing'
        | 'all'
        | null
    >('webdevelopment')
    const mobileDevelopment = courseDetail.filter(
        (name) => name.category === 'mobiledevelopment'
    )
    const webDevelopment = courseDetail.filter(
        (name) => name.category === 'webdevelopment'
    )
    const dataScience = courseDetail.filter(
        (name) => name.category === 'datascience'
    )
    const cloudComputing = courseDetail.filter(
        (name) => name.category === 'cloudcomputing'
    )

    let selectedNames: Name[] = []
    if (selectedButton === 'mobiledevelopment') {
        selectedNames = mobileDevelopment
    } else if (selectedButton === 'webdevelopment') {
        selectedNames = webDevelopment
    } else if (selectedButton === 'datascience') {
        selectedNames = dataScience
    } else if (selectedButton === 'cloudcomputing') {
        selectedNames = cloudComputing
    }

    const nameElements = selectedNames.map((name, index) => (
        <div id='Courses' key={index} className='shadow-lg rounded-xl group flex'>
            <div className='py-5 lg:py-0 flex flex-col'>
                <div className='overflow-hidden rounded-lg bg-gray-100'>
                    <Image
                        src={withBasePath(name.imageSrc)}
                        alt={name.course}
                        width={700}
                        height={700}
                        className='h-full w-full object-cover object-center group-hover:scale-125 transition duration-300 ease-in-out'
                    />
                </div>
                <div className='p-4 flex flex-col justify-between gap-5 flex-1'>
                    <div className="flex flex-col gap-5">
                        <div className='flex items-center justify-between'>
                            <p className='block font-normal text-gray-900'>{name.course}</p>
                            <div className='block text-lg font-semibold text-success border-solid border-2 border-success rounded-md px-1'>
                                <p>${name.price}</p>
                            </div>
                        </div>
                        <Link href={'/'}>
                            <p
                                aria-hidden='true'
                                className='text-xl font-semibold group-hover:text-primary group-hover:cursor-pointer'>
                                {name.profession}
                            </p>
                        </Link>
                    </div>
                    <div className='flex justify-between border-solid border-2 rounded-md p-2'>
                        <p>12 Classes</p>
                        <div className='flex flex-row space-x-4'>
                            <div className='flex'>
                                <Image
                                    src={withBasePath('/images/courses/account.svg')}
                                    width={18}
                                    height={20}
                                    alt='circle'
                                />
                                <p className='text-lightgrey ml-1'>120</p>
                            </div>
                            <div className='flex'>
                                <Image
                                    src={withBasePath('/images/courses/Star.svg')}
                                    width={18}
                                    height={20}
                                    alt='star'
                                />
                                <p className='ml-1'>4.5</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ))

    return (
        <section id='courses-section'>
            <div className='container mx-auto max-w-7xl px-4'>
                <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-5 mb-4'>
                    <h2 className='font-bold tracking-tight'>Popular Courses</h2>
                    <div>
                        <button className='bg-transparent cursor-pointer hover:bg-primary text-primary font-medium hover:text-white py-3 px-4 border border-primary hover:border-transparent rounded-sm duration-300'>
                            Explore Classes
                        </button>
                    </div>
                </div>
                <div className='flex nowhitespace space-x-5 rounded-xl bg-white p-1 overflow-x-auto mb-4'>
                    {/* FOR DESKTOP VIEW */}
                    <button
                        onClick={() => setSelectedButton('webdevelopment')}
                        className={
                            'bg-white' +
                            (selectedButton === 'webdevelopment'
                                ? 'text-black border-b-2 border-yellow-200'
                                : 'text-black/40') +
                            ' pb-2 text-lg hidden sm:block hover:cursor-pointer'
                        }>
                        Web Development
                    </button>
                    <button
                        onClick={() => setSelectedButton('mobiledevelopment')}
                        className={
                            'bg-white ' +
                            (selectedButton === 'mobiledevelopment'
                                ? 'text-black border-b-2 border-yellow-200'
                                : 'text-black/40') +
                            ' pb-2 text-lg hidden sm:block hover:cursor-pointer'
                        }>
                        Mobile Development
                    </button>
                    <button
                        onClick={() => setSelectedButton('datascience')}
                        className={
                            'bg-white ' +
                            (selectedButton === 'datascience'
                                ? 'text-black border-b-2 border-yellow-200'
                                : 'text-black/40') +
                            ' pb-2 text-lg hidden sm:block hover:cursor-pointer'
                        }>
                        Data Science
                    </button>
                    <button
                        onClick={() => setSelectedButton('cloudcomputing')}
                        className={
                            'bg-white ' +
                            (selectedButton === 'cloudcomputing'
                                ? 'text-black border-b-2 border-yellow-200'
                                : 'text-black/40') +
                            ' pb-2 text-lg hidden sm:block hover:cursor-pointer'
                        }>
                        Cloud Computing
                    </button>

                    {/* FOR MOBILE VIEW */}
                    <Icon
                        icon='solar:global-line-duotone'
                        onClick={() => setSelectedButton('webdevelopment')}
                        className={
                            'text-5xl sm:hidden block ' +
                            (selectedButton === 'webdevelopment'
                                ? 'border-b-2 border-yellow-200'
                                : 'text-gray-400')
                        }
                    />

                    <Icon
                        icon='solar:smartphone-line-duotone'
                        onClick={() => setSelectedButton('mobiledevelopment')}
                        className={
                            'text-5xl sm:hidden block ' +
                            (selectedButton === 'mobiledevelopment'
                                ? 'border-b-2 border-yellow-200'
                                : 'text-gray-400')
                        }
                    />

                    <Icon
                        icon='solar:database-line-duotone'
                        onClick={() => setSelectedButton('datascience')}
                        className={
                            'text-5xl sm:hidden block ' +
                            (selectedButton === 'datascience'
                                ? 'border-b-2 border-yellow-200'
                                : 'text-gray-400')
                        }
                    />

                    <Icon
                        icon='solar:cloud-line-duotone'
                        onClick={() => setSelectedButton('cloudcomputing')}
                        className={
                            'text-5xl sm:hidden block ' +
                            (selectedButton === 'cloudcomputing'
                                ? 'border-b-2 border-yellow-200'
                                : 'text-gray-400')
                        }
                    />
                </div>
                <div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <CourseDetailSkeleton key={i} />
                            ))
                        ) : nameElements.length > 0 ? (
                            nameElements
                        ) : (
                            <p>No data to show</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default NamesList
