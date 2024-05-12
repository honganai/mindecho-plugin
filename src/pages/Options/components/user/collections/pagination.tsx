import React, { useState } from 'react';
// import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

const Pagination = ({
  page = 1,
  totalPage = 1,
  pageSize = 10,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState(page);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPage) return;
    setCurrentPage(newPage);
    onPageChange(newPage);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
      <a
        href="#"
        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <span className="sr-only">Previous</span>
        {/* <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" /> */}
      </a>
      {pageNumbers.map((pageNumber) => (
        <a
          key={pageNumber}
          href="#"
          aria-current={currentPage === pageNumber ? 'page' : undefined}
          className={
            currentPage === pageNumber
              ? 'relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
          }
          onClick={() => handlePageChange(pageNumber)}
        >
          {pageNumber}
        </a>
      ))}
      <a
        href="#"
        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <span className="sr-only">Next</span>
        {/* <ChevronRightIcon className="h-5 w-5" aria-hidden="true" /> */}
      </a>
    </nav>
  );
};

export default Pagination;