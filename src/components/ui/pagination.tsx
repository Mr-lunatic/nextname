"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大显示页数，显示所有页
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 复杂的分页逻辑
      const halfVisible = Math.floor(maxVisiblePages / 2)
      let startPage = Math.max(1, currentPage - halfVisible)
      let endPage = Math.min(totalPages, currentPage + halfVisible)

      // 调整起始和结束页以确保显示足够的页数
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }
      }

      // 添加第一页和省略号
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      // 添加中间页
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // 添加省略号和最后一页
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav className={cn("flex items-center justify-center space-x-1", className)}>
      {/* 第一页按钮 */}
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          className="hidden sm:flex"
        >
          First
        </Button>
      )}

      {/* 上一页按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>

      {/* 页码按钮 */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <div className="flex items-center justify-center w-9 h-9">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="w-9 h-9"
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 下一页按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 最后一页按钮 */}
      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="hidden sm:flex"
        >
          Last
        </Button>
      )}
    </nav>
  )
}

// 分页信息组件
interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  )
}
