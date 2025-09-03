-- Create hero_slides table for managing slideshow content
CREATE TABLE IF NOT EXISTS hero_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    media_type ENUM('image', 'video') DEFAULT 'image',
    media_url VARCHAR(500) NOT NULL,
    media_thumbnail VARCHAR(500),
    button1_text VARCHAR(100),
    button1_url VARCHAR(500),
    button2_text VARCHAR(100),
    button2_url VARCHAR(500),
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample slides
INSERT INTO hero_slides (title, subtitle, description, media_type, media_url, button1_text, button1_url, button2_text, button2_url, position, is_active) VALUES
('Summer Collection 2024', 'New Arrivals', 'Discover elegance redefined with our latest luxury pieces. Premium quality meets contemporary design.', 'image', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Shop Collection', 'collections.html', 'View New Arrivals', 'collections.html#new-arrivals', 1, TRUE),
('Timeless Craftsmanship', 'Limited Edition', 'Handcrafted with precision and passion. Every piece tells a story of excellence.', 'image', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Explore Now', 'collections.html', 'Limited Pieces', 'collections.html#limited-edition', 2, TRUE),
('Urban Luxury', 'Premium Quality', 'Where street culture meets luxury fashion. Bold designs for the modern individual.', 'image', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Shop Now', 'collections.html', 'Learn More', 'about.html', 3, TRUE);

-- Create hero_slide_media table for additional media files
CREATE TABLE IF NOT EXISTS hero_slide_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slide_id INT NOT NULL,
    media_type ENUM('image', 'video') DEFAULT 'image',
    media_url VARCHAR(500) NOT NULL,
    media_thumbnail VARCHAR(500),
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slide_id) REFERENCES hero_slides(id) ON DELETE CASCADE
);






























