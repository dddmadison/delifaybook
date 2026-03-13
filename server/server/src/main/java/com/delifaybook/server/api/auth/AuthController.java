package com.delifaybook.server.api.auth;

import com.delifaybook.server.api.auth.dto.LoginRequest;
import com.delifaybook.server.api.auth.dto.SignupRequest;
import com.delifaybook.server.api.me.dto.MeResponse;
import com.delifaybook.server.domain.user.UserEntity;
import com.delifaybook.server.domain.user.UserRepository;
import com.delifaybook.server.global.error.ApiError;
import com.delifaybook.server.global.response.ApiResponse;
import com.delifaybook.server.global.security.DbUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException; // ✅ 여기
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody SignupRequest req,
                                      HttpServletRequest request) {

        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiError.of("DUP_EMAIL", "이미 사용 중인 이메일입니다.", request.getRequestURI()));
        }

        UserEntity u = new UserEntity(
                req.email(),
                passwordEncoder.encode(req.password()),
                req.nickname()
        );

        UserEntity saved = userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.ok(toMe(saved)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );

            // ✅ 세션에 SecurityContext 저장(세션 기반 로그인 고정)
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            request.getSession(true).setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            // ✅ principal로 바로 MeResponse 만들기 (가능하면 DB 재조회 없이)
            Object principal = auth.getPrincipal();
            if (principal instanceof DbUserDetails p) {
                return ResponseEntity.ok(ApiResponse.ok(
                        new MeResponse(p.getId(), p.getEmail(), p.getNickname())
                ));
            }

            // fallback: 혹시 principal 타입이 다르면 DB로 조회
            UserEntity u = userRepository.findByEmail(req.email()).orElse(null);
            if (u == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiError.of("AUTH_FAILED", "이메일 또는 비밀번호가 올바르지 않습니다.", request.getRequestURI()));
            }

            return ResponseEntity.ok(ApiResponse.ok(toMe(u)));

        } catch (AuthenticationException e) { // ✅ 여기
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiError.of("AUTH_FAILED", "이메일 또는 비밀번호가 올바르지 않습니다.", request.getRequestURI()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        // ✅ LogoutResponse 삭제했으니 boolean으로 고정
        return ResponseEntity.ok(ApiResponse.ok(true));
    }

    private MeResponse toMe(UserEntity u) {
        return new MeResponse(u.getId(), u.getEmail(), u.getNickname());
    }
}
