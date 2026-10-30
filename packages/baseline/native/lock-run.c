#include <sys/file.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int main(int argc, char **argv) {
  struct stat info;
  if (argc < 4) return 64;
  int fd = open(argv[1], O_RDWR | O_CREAT | O_NOFOLLOW, 0600);
  if (fd < 0) return 65;
  if (fstat(fd, &info) != 0 || !S_ISREG(info.st_mode) || info.st_uid != getuid() ||
      info.st_nlink != 1 || (info.st_mode & 077) != 0) return 65;
  if (flock(fd, LOCK_EX | LOCK_NB) != 0) return 75;
  if (fd != 3) {
    if (dup2(fd, 3) < 0) return 65;
    close(fd);
  }
  if (fcntl(3, F_SETFD, 0) < 0) return 65;
  execv(argv[2], &argv[2]);
  return 69;
}
