// MeController.java
package com.delifaybook.server.api.me;

import com.delifaybook.server.api.me.dto.MeResponse;
import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.response.ApiResponse;
import com.delifaybook.server.global.security.DbUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class MeController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me(
            @AuthenticationPrincipal DbUserDetails principal
    ) {
        // 에러 포맷 혼용 방지: 컨트롤러에서 직접 fail 내려주지 말고 예외로 통일
        if (principal == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }

        MeResponse profile = new MeResponse(
                principal.getId(),
                principal.getEmail(),
                principal.getNickname()
        );

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }
    
    
}
