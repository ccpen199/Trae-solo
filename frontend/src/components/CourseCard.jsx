import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, Clock } from 'lucide-react';

const CourseCard = ({ course }) => {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={course.cover || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=course%20cover%20education&image_size=square_hd'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-blue-600 ml-1" />
          </div>
        </div>
        {course.is_free ? (
          <span className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
            免费
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
            ¥{course.price}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.buy_count || 0}人学习</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration || '未知'}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">{course.instructor || '讲师'}</span>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {course.level === 'beginner' ? '入门' : course.level === 'intermediate' ? '进阶' : '高级'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
