import express from 'express';

const router = express.Router();

router.get('/student/dashboard', function(req, res) {
    res.render('vwStudent/dashboard', {
        title: 'Trang chủ học viên',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        },
        stats: {
            enrolled_courses: 5,
            completed_courses: 2,
            in_progress_courses: 3,
            certificates: 2,
            total_learning_hours: 48
        },
        recentCourses: [
            {
                id: 1,
                title: 'Complete Python Bootcamp',
                thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
                progress: 45,
                last_watched: new Date(),
                teacher: { full_name: 'Jose Portilla' }
            },
            {
                id: 2,
                title: 'JavaScript Complete Course',
                thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
                progress: 78,
                last_watched: new Date(),
                teacher: { full_name: 'Jonas Schmedtmann' }
            }
        ],
        recommendedCourses: [
            {
                id: 3,
                title: 'React - The Complete Guide',
                thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
                rating_avg: 4.8,
                rating_count: 6123,
                discount_price: 449000,
                category: { name: 'Lập trình' },
                teacher: { full_name: 'Maximilian Schwarzmüller' }
            }
        ]
    });
});

router.get('/courses/:id', function(req, res) {
    res.render('vwStudent/course-detail', {
        title: 'Chi tiết khóa học',
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp: Go from zero to hero in Python 3',
            short_description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
            full_description: '<h3>Khóa học này là gì?</h3><p>Đây là khóa học Python toàn diện nhất trên Udemy! Cho dù bạn chưa từng lập trình bao giờ, hay muốn nâng cao kỹ năng Python hiện có, hoặc muốn học các tính năng mới nhất của Python 3, khóa học này dành cho bạn!</p>',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            rating_avg: 4.6,
            rating_count: 4789,
            enrollment_count: 42567,
            view_count: 125000,
            total_lectures: 185,
            total_duration: '22 giờ',
            total_resources: 15,
            updated_at: new Date(),
            category: {
                id: 1,
                name: 'Lập trình'
            },
            teacher: {
                id: 1,
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
                bio: 'Head of Data Science at Pierian Data Inc.',
                rating_avg: 4.7,
                total_students: 1250000,
                total_courses: 25
            },
            sections: [
                {
                    title: 'Course Introduction',
                    duration: '30 phút',
                    lectures: [
                        { id: 1, title: 'Introduction to Course', duration: '10:30', is_preview: true },
                        { id: 2, title: 'Course Curriculum Overview', duration: '15:45', is_preview: true },
                        { id: 3, title: 'Setting up Environment', duration: '20:15', is_preview: false }
                    ]
                }
            ]
        },
        relatedCourses: [
            {
                id: 2,
                title: 'The Complete JavaScript Course 2024',
                thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
                rating_avg: 4.7,
                rating_count: 5234,
                discount_price: 399000,
                category: { name: 'Lập trình' },
                teacher: {
                    full_name: 'Jonas Schmedtmann',
                    avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
                }
            }
        ],
        reviews: [
            {
                id: 1,
                rating: 5,
                content: 'Khóa học tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu.',
                created_at: new Date(),
                student: {
                    full_name: 'Nguyễn Văn A',
                    avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
                }
            }
        ]
    });
});

router.get('/student/profile', function(req, res) {
    res.render('vwStudent/profile', {
        title: 'Hồ sơ cá nhân',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        }
    });
});

router.get('/student/my-courses', function(req, res) {
    res.render('vwStudent/my-courses', {
        title: 'Khóa học của tôi',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        },
        enrolledCourses: [
            {
                id: 1,
                progress: 45,
                completed_lectures: 15,
                total_lectures: 33,
                course: {
                    id: 1,
                    title: 'Complete Python Bootcamp',
                    thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
                    category: { name: 'Lập trình' },
                    teacher: { full_name: 'Jose Portilla' }
                }
            }
        ]
    });
});

router.get('/student/watchlist', function(req, res) {
    res.render('vwStudent/watchlist', {
        title: 'Danh sách yêu thích',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        },
        watchlist: [
            {
                id: 1,
                course: {
                    id: 2,
                    title: 'The Complete JavaScript Course 2024',
                    thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
                    rating_avg: 4.7,
                    rating_count: 5234,
                    enrollment_count: 35000,
                    discount_price: 399000,
                    category: { name: 'Lập trình' },
                    teacher: {
                        full_name: 'Jonas Schmedtmann',
                        avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
                    }
                }
            }
        ]
    });
});

router.get('/learn/:courseId', function(req, res) {
    res.render('vwStudent/learn', {
        layout: false,
        course: {
            id: req.params.courseId,
            title: 'Complete Python Bootcamp',
            category: { name: 'Lập trình' },
            sections: [
                {
                    title: 'Course Introduction',
                    lectures: [
                        {
                            id: 1,
                            title: 'Introduction to Course',
                            duration: '10:30',
                            is_completed: true,
                            description: 'Welcome to the course!'
                        },
                        {
                            id: 2,
                            title: 'Course Curriculum Overview',
                            duration: '15:45',
                            is_completed: false,
                            description: 'Overview of what we will learn'
                        }
                    ]
                }
            ]
        },
        currentLecture: {
            id: 1,
            title: 'Introduction to Course',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            description: 'Welcome to the course! In this lecture, we will introduce you to the course content.',
            resources: []
        },
        currentLectureIndex: 1,
        totalLectures: 185,
        completedLectures: 15,
        progress: 8,
        notes: []
    });
});

router.post('/student/profile', function(req, res) {
    res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
});

router.post('/student/change-password', function(req, res) {
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

router.post('/student/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã thêm vào watchlist!' });
});

router.delete('/student/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khỏi watchlist!' });
});

router.post('/learn/:courseId/lecture/:lectureId/complete', function(req, res) {
    res.json({ success: true, message: 'Đã đánh dấu hoàn thành!' });
});

router.post('/learn/:courseId/notes', function(req, res) {
    res.json({ success: true, message: 'Đã lưu ghi chú!' });
});

router.delete('/learn/:courseId/notes/:noteId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa ghi chú!' });
});

export default router;
